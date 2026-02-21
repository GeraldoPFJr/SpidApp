import type { FastifyInstance } from 'fastify'

export async function purchasesRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Purchases - em construcao' }
  })
}
