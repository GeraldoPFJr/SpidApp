import type { FastifyInstance } from 'fastify'

export async function syncRoutes(app: FastifyInstance) {
  app.post('/push', async () => {
    return { message: 'Sync push - em construcao' }
  })

  app.get('/pull', async () => {
    return { message: 'Sync pull - em construcao' }
  })
}
