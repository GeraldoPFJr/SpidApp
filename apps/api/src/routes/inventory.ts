import type { FastifyInstance } from 'fastify'

export async function inventoryRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'Inventory - em construcao' }
  })
}
