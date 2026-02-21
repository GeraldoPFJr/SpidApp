# RULES_GENERAL — Spid

## Git
- Git flow: main → dev → feat/<slug>, fix/<slug>
- Conventional Commits: feat:, fix:, chore:, refactor:, test:
- PRs pequenos e rastreavéis

## Codigo
- TypeScript estrito em todo o monorepo
- Zod para validacao de inputs
- Prisma como ORM
- Soft-delete (deleted_at) para entidades mestre
- Idioma do codigo: ingles
- Idioma da UI: portugues (PT-BR)

## Testes Minimos Obrigatorios
- Conversao de unidades (ovo: caixa→cartela→bandeja→unidade)
- FIFO: consumir lotes na ordem
- Custo medio: recalcular apos entrada
- Geracao de parcelas
- Cancelamento: reversoes de estoque + financeiro
- Sync: reenvio sem duplicata (operationId)

## Seguranca
- .env nunca versionado
- SYNC_SECRET e APP_INSTANCE_ID obrigatorios
- TLS no trafego
- Logs sem dados sensiveis (CPF completo, etc.)
