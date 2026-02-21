# TECNICO — Spid

## Stack
- **Mobile**: React + TypeScript + Capacitor + SQLite
- **Web**: Next.js + TypeScript
- **API**: Node.js + Fastify + TypeScript
- **ORM**: Prisma
- **Banco**: Neon Postgres
- **Validacao**: Zod
- **Monorepo**: pnpm workspaces

## Infraestrutura
- Neon Postgres (cloud) como fonte de verdade
- SQLite no mobile como banco local
- Impressao termica Bluetooth via ESC/POS (GOOPJRT PT-260)
- APK distribuido diretamente (sem Play Store inicialmente)

## Autenticacao
- Sem login. APP_INSTANCE_ID (UUID) + SYNC_SECRET
- Cada dispositivo: device_id unico

## API Endpoints Principais
- `POST /sync/push` — operacoes offline
- `GET /sync/pull` — mudancas desde cursor
- CRUD: /products, /customers, /suppliers, /sales, /purchases
- /inventory, /finance/accounts, /finance/entries
- /receivables, /receivables/:id/settle
- /reports/dashboard, /reports/products-3m, /reports/customers-3m, /reports/cashflow

## Schema (17+ tabelas)
Ver descritivo.md secao 8 para schema completo.
Padroes: soft-delete (deleted_at), timestamps, indices em campos de consulta frequente.
