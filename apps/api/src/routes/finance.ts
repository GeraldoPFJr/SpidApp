import type { FastifyInstance } from 'fastify'

export async function financeRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Finance - em construcao' }
  })
}
