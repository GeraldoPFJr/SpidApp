import type { FastifyInstance } from 'fastify'

export async function reportsRoutes(app: FastifyInstance) {
  app.get('/dashboard', async () => {
    return { message: 'Reports dashboard - em construcao' }
  })

  app.get('/products-3m', async () => {
    return { message: 'Reports products 3m - em construcao' }
  })

  app.get('/customers-3m', async () => {
    return { message: 'Reports customers 3m - em construcao' }
  })

  app.get('/cashflow', async () => {
    return { message: 'Reports cashflow - em construcao' }
  })
}
