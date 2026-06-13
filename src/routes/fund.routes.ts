import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function registerFundRoutes(app: FastifyInstance) {
  app.get("/funds", async (_request, reply) => {
    const funds = await prisma.fund.findMany({
      orderBy: {
        created_at: "asc",
      },
    });

    return reply.status(200).send(
      funds.map((fund) => ({
        ...fund,
        target_size_usd: Number(fund.target_size_usd),
        created_at: fund.created_at.toISOString(),
      }))
    );
  });
}
