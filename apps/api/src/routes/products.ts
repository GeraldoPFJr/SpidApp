import type { FastifyInstance } from 'fastify'

export async function productsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Products - em construcao' }
  })
}
