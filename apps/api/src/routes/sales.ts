import type { FastifyInstance } from 'fastify'

export async function salesRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Sales - em construcao' }
  })
}
