import type { FastifyInstance } from 'fastify'

export async function customersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Customers - em construcao' }
  })
}
