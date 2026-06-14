import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { prisma } from "../db";
import { ErrorResponseSchema } from "../schemas/error.schema";
import {
  CreateInvestorBodySchema,
  InvestorResponseSchema,
  InvestorsResponseSchema,
} from "../schemas/investor.schema";

type ApiInvestorType = "Individual" | "Institution" | "Family Office";
type PrismaInvestorType = "Individual" | "Institution" | "Family_Office";

function toPrismaInvestorType(type: ApiInvestorType): PrismaInvestorType {
  if (type === "Family Office") {
    return "Family_Office";
  }

  return type;
}

function toApiInvestorType(type: PrismaInvestorType): ApiInvestorType {
  if (type === "Family_Office") {
    return "Family Office";
  }

  return type;
}

function serializeInvestor(investor: {
  id: string;
  name: string;
  investor_type: PrismaInvestorType;
  email: string;
  created_at: Date;
}) {
  return {
    id: investor.id,
    name: investor.name,
    investor_type: toApiInvestorType(investor.investor_type),
    email: investor.email,
    created_at: investor.created_at.toISOString(),
  };
}

export async function registerInvestorRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>();

  server.get(
    "/investors",
    {
      schema: {
        response: {
          200: InvestorsResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const investors = await prisma.investor.findMany({
        orderBy: {
          created_at: "asc",
        },
      });

      return reply.status(200).send(investors.map(serializeInvestor));
    }
  );

  server.post(
    "/investors",
    {
      schema: {
        body: CreateInvestorBodySchema,
        response: {
          201: InvestorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const investor = await prisma.investor.create({
          data: {
            name: request.body.name,
            investor_type: toPrismaInvestorType(request.body.investor_type),
            email: request.body.email,
          },
        });

        return reply.status(201).send(serializeInvestor(investor));
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return reply.status(409).send({
            error: {
              code: "CONFLICT",
              message: "Investor email already exists",
            },
          });
        }

        throw error;
      }
    }
  );
}