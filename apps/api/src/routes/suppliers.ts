import type { FastifyInstance } from 'fastify'

export async function suppliersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Suppliers - em construcao' }
  })
}
