import { FastifyInstance } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { prisma } from '../db'
import {
  CreateFundBodySchema,
  ErrorResponseSchema,
  FundIdParamsSchema,
  FundResponseSchema,
  FundsResponseSchema,
  UpdateFundBodySchema,
} from '../schemas/fund.schema'

function serializeFund(fund: {
  id: string
  name: string
  vintage_year: number
  target_size_usd: unknown
  status: 'Fundraising' | 'Investing' | 'Closed'
  created_at: Date
}) {
  return {
    id: fund.id,
    name: fund.name,
    vintage_year: fund.vintage_year,
    target_size_usd: Number(fund.target_size_usd),
    status: fund.status,
    created_at: fund.created_at.toISOString(),
  }
}

export async function registerFundRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<TypeBoxTypeProvider>()

  server.get(
    '/funds',
    {
      schema: {
        response: {
          200: FundsResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const funds = await prisma.fund.findMany({
        orderBy: {
          created_at: 'asc',
        },
      })

      return reply.status(200).send(funds.map(serializeFund))
    },
  )

  server.get(
    '/funds/:id',
    {
      schema: {
        params: FundIdParamsSchema,
        response: {
          200: FundResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const fund = await prisma.fund.findUnique({
        where: { id },
      })

      if (!fund) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Fund not found',
          },
        })
      }

      return reply.status(200).send(serializeFund(fund))
    },
  )
  server.put(
    '/funds',
    {
      schema: {
        body: UpdateFundBodySchema,
        response: {
          200: FundResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id, ...data } = request.body

      const existingFund = await prisma.fund.findUnique({
        where: { id },
      })

      if (!existingFund) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Fund not found',
          },
        })
      }

      const updatedFund = await prisma.fund.update({
        where: { id },
        data,
      })

      return reply.status(200).send(serializeFund(updatedFund))
    },
  )
  server.post(
    '/funds',
    {
      schema: {
        body: CreateFundBodySchema,
        response: {
          201: FundResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const fund = await prisma.fund.create({
        data: request.body,
      })

      return reply.status(201).send(serializeFund(fund))
    },
  )
}
