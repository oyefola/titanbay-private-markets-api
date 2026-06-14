import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { registerHealthRoutes } from './routes/health.routes'
import { registerFundRoutes } from './routes/fund.routes'
import { registerInvestorRoutes } from './routes/investor.routes'
import { registerInvestmentRoutes } from './routes/investments.routes'

export function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>()

  app.register(registerHealthRoutes)
  app.register(registerFundRoutes)
  app.register(registerInvestorRoutes)
  app.register(registerInvestmentRoutes)

  return app
}
