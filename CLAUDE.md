# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**Vendi** — Sistema de vendas offline-first para vendedor autônomo de ovos e mercearia (porta a porta + WhatsApp). Operação 100% offline no celular Android com sincronização posterior para Neon Postgres.

**Status**: Especificação completa, sem código implementado. Documentação de referência em `descritivo.md`, `diretrizes.md`, `inicio.md` e `tasklist.md`.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile (Android) | React + TypeScript + Capacitor + SQLite local |
| Web (PC) | Next.js (React + TypeScript) |
| Backend/API | Node.js + TypeScript + Fastify |
| ORM | Prisma |
| Banco | Neon Postgres |
| Validação | Zod |
| Monorepo | pnpm workspaces |

## Estrutura do Monorepo

```
/apps
  /api         — Backend Fastify + Prisma
  /web         — Next.js (PC)
  /mobile      — React + Capacitor (Android)
/packages
  /shared      — Tipos TS, validações Zod, regras de negócio
  /ui          — Componentes React reutilizáveis
/prisma        — Schema e migrations
/.docs         — Documentação do projeto
```

## Comandos de Desenvolvimento

```bash
pnpm install              # instalar dependências
pnpm dev                  # rodar tudo em paralelo
pnpm dev:api              # só backend
pnpm dev:web              # só Next.js
pnpm dev:mobile           # só mobile

pnpm build                # build completo
pnpm lint                 # lint
pnpm format               # formatação
pnpm test                 # testes

# Banco
pnpm db:migrate           # rodar migrations
pnpm db:generate          # Prisma codegen
pnpm db:studio            # Prisma Studio

# Mobile
npx cap sync android      # sync Capacitor
```

## Arquitetura Core

### Offline-First (padrão central)
1. Mobile escreve no **SQLite local** + gera registro em `outbox_operations` com `operationId` (UUID)
2. Quando online → `POST /sync/push` envia operações pendentes
3. Backend aplica em transação, rejeita duplicatas por `operationId`
4. `GET /sync/pull` retorna mudanças desde o último cursor
5. Mobile aplica no SQLite local

### Resolução de Conflitos
- **Cadastros** (produtos, clientes, fornecedores): Last-Write-Wins por `updatedAt`
- **Movimentações** (estoque, financeiro): Append-only + idempotência. Nunca editar movimento; corrigir com movimento de ajuste

### Estoque e Financeiro como Eventos
- Saldo de estoque = Σ(entradas) - Σ(saídas) em **unidade base** (inteiro)
- Saldo financeiro por conta = Σ(entradas) - Σ(saídas)
- Proibido editar saldo diretamente; usar ajuste/inventário/lançamento

### Conversão de Unidades (o "problema do ovo")
- Todo estoque armazenado em **unidade base** (ex: 1 ovo)
- Cada produto define unidades vendáveis com fator configurável:
  - Bandeja = 12, Cartela = 30, Caixa = 360 (ou 240, configurável por fornecedor)
- Compra e venda convertem para base automaticamente

### Método de Custo (configurável em Settings)
- **FIFO** (padrão): compras geram lotes (`cost_lots`); vendas consomem na ordem
- **Custo Médio**: recalcula após cada entrada; COGS usa custo médio vigente

## Autenticação

Sem login/senha. Identifica por `APP_INSTANCE_ID` (UUID) + `SYNC_SECRET`. Cada dispositivo tem `device_id` para rastrear origem. Rotação de secret possível via Settings.

## Banco de Dados (17 tabelas principais)

Catálogos: `categories`, `subcategories`, `products`, `product_units`, `price_tiers`, `product_prices`
Mestres: `customers`, `suppliers`
Compras: `purchases`, `purchase_items`, `purchase_costs`
Estoque: `inventory_movements`, `cost_lots`
Vendas: `sales`, `sale_items`
Recebíveis: `receivables`, `receivable_settlements`
Financeiro: `accounts`, `finance_categories`, `finance_entries`, `payments`, `monthly_closures`
Offline: `outbox_operations`

Padrões: soft-delete (`deleted_at`) em entidades mestre, timestamps `created_at`/`updated_at`.

## Convenções

- **TypeScript estrito** em todo o monorepo
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`
- **Git flow**: `main` → `dev` → `feat/<slug>` ou `fix/<slug>`
- **Validação**: Zod em todo input de API
- **Soft-delete**: nunca deletar fisicamente entidades mestre
- **Idioma do código**: inglês (nomes de variáveis, tabelas, campos)
- **Idioma da UI**: português (PT-BR)

## Regras de Negócio Críticas

- Venda em rascunho (DRAFT) **não** abate estoque; só ao confirmar
- Cancelamento exige questionário (destino mercadoria + destino dinheiro) e gera reversões rastreáveis
- Split de pagamentos: qualquer combinação de dinheiro/pix/cartão/crediário/boleto/cheque
- Crediário/boleto/cheque podem ser parcelados com intervalo configurável (dias ou "mesmo dia do mês")
- Inadimplentes: modal ao abrir app + tela dedicada
- Cupom não fiscal: PDF + impressão 60mm/80mm (ESC/POS Bluetooth) + A5
- Lucro líquido = receitas - custo produto - rateio despesas (proporcional ao faturamento)
