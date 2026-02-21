import cors from '@fastify/cors'
import Fastify from 'fastify'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.js'
import { categoriesRoutes } from './routes/categories.js'
import { productsRoutes } from './routes/products.js'
import { customersRoutes } from './routes/customers.js'
import { suppliersRoutes } from './routes/suppliers.js'
import { purchasesRoutes } from './routes/purchases.js'
import { salesRoutes } from './routes/sales.js'
import { inventoryRoutes } from './routes/inventory.js'
import { receivablesRoutes } from './routes/receivables.js'
import { financeRoutes } from './routes/finance.js'
import { syncRoutes } from './routes/sync.js'
import { reportsRoutes } from './routes/reports.js'

const app = Fastify({ logger: true })

async function main() {
  await app.register(cors, { origin: true })

  await app.register(healthRoutes)
  await app.register(categoriesRoutes, { prefix: '/categories' })
  await app.register(productsRoutes, { prefix: '/products' })
  await app.register(customersRoutes, { prefix: '/customers' })
  await app.register(suppliersRoutes, { prefix: '/suppliers' })
  await app.register(purchasesRoutes, { prefix: '/purchases' })
  await app.register(salesRoutes, { prefix: '/sales' })
  await app.register(inventoryRoutes, { prefix: '/inventory' })
  await app.register(receivablesRoutes, { prefix: '/receivables' })
  await app.register(financeRoutes, { prefix: '/finance' })
  await app.register(syncRoutes, { prefix: '/sync' })
  await app.register(reportsRoutes, { prefix: '/reports' })

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

main().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
