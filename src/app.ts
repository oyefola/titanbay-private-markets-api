import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { registerHealthRoutes } from "./routes/health.routes";
import { registerFundRoutes } from "./routes/fund.routes";

export function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(registerHealthRoutes);
  app.register(registerFundRoutes);

  return app;
}