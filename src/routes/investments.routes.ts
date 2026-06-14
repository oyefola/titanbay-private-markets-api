import { FastifyInstance } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { prisma } from "../db";
import { ErrorResponseSchema } from "../schemas/error.schema";
import {
  CreateInvestmentBodySchema,
  FundIdParamsSchema,
  InvestmentResponseSchema,
  InvestmentsResponseSchema,
} from "../schemas/investment.schema";

function serializeInvestment(investment: {
  id: string;
  investor_id: string;
  fund_id: string;
  amount_usd: unknown;
  investment_date: Date;
}) {
  return {
    id: investment.id,
    investor_id: investment.investor_id,
    fund_id: investment.fund_id,
    amount_usd: Number(investment.amount_usd),
    investment_date: investment.investment_date.toISOString().slice(0, 10),
  };
}

export async function registerInvestmentRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>();

  server.get(
    "/funds/:fund_id/investments",
    {
      schema: {
        params: FundIdParamsSchema,
        response: {
          200: InvestmentsResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { fund_id } = request.params;

      const fund = await prisma.fund.findUnique({
        where: { id: fund_id },
      });

      if (!fund) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Fund not found",
          },
        });
      }

      const investments = await prisma.investment.findMany({
        where: { fund_id },
        orderBy: {
          investment_date: "asc",
        },
      });

      return reply.status(200).send(investments.map(serializeInvestment));
    }
  );

  server.post(
    "/funds/:fund_id/investments",
    {
      schema: {
        params: FundIdParamsSchema,
        body: CreateInvestmentBodySchema,
        response: {
          201: InvestmentResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { fund_id } = request.params;
      const { investor_id, amount_usd, investment_date } = request.body;

      const fund = await prisma.fund.findUnique({
        where: { id: fund_id },
      });

      if (!fund) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Fund not found",
          },
        });
      }

      const investor = await prisma.investor.findUnique({
        where: { id: investor_id },
      });

      if (!investor) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Investor not found",
          },
        });
      }

      const investment = await prisma.investment.create({
        data: {
          fund_id,
          investor_id,
          amount_usd,
          investment_date: new Date(investment_date),
        },
      });

      return reply.status(201).send(serializeInvestment(investment));
    }
  );
}