# DIRETRIZES — Sistema de Vendas Offline-First (Ovos + Mercearia)
Data: 2026-02-21
Versão: 1.0

## 1) Princípios
- Simplicidade > complexidade (o usuário é único e precisa de velocidade)
- Offline-first no Android é requisito inegociável
- Movimentações (estoque/financeiro) devem ser rastreáveis e idempotentes
- UX mobile-first (3 cliques nos fluxos principais)
- Dados consistentes: preferir “eventos/movimentos” ao invés de “saldo mutável”

## 2) Convenções de repositório
### Estrutura sugerida (monorepo)
/apps
/api
/web
/mobile
/packages
/shared (tipos, validações, regras de negócio)
/ui (componentes)


### Padrões
- TypeScript estrito
- Zod (ou similar) para validação de inputs
- Prisma como ORM
- Soft-delete (`deleted_at`) para entidades mestre

## 3) Fluxo Git e commits
- Git flow simplificado:
  - `main` (produção)
  - `dev` (integração)
  - `feat/<slug>`, `fix/<slug>`
- Conventional Commits:
  - `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `test: ...`
- PRs pequenos e rastreáveis

## 4) Qualidade e testes
- Cobrir com testes (mínimo):
  - regras de conversão de unidades
  - FIFO/custo médio
  - geração de parcelas
  - cancelamento (reversões)
  - sync idempotente (reenvio)
- E2E smoke:
  - criar venda offline, imprimir PDF, sincronizar

## 5) Offline e sincronização (regras de ouro)
- Toda escrita no mobile deve:
  1) persistir no SQLite local
  2) gerar uma `outbox_operation` com `operationId` (UUID)
- O server deve:
  - rejeitar duplicatas pelo `operationId`
  - aplicar operações em transação
- Conflitos:
  - cadastros: LWW por `updatedAt`
  - movimentos: append-only (sem “editar movimento”; se precisar corrigir, criar movimento de ajuste)

## 6) Estoque e financeiro como “movimentos”
- Estoque: saldo = soma(entradas) - soma(saídas) em base units
- Financeiro: saldo por conta = soma(entradas) - soma(saídas)
- Proibir “editar saldo diretamente”; usar ajuste/inventário/lançamento

## 7) Segurança e segredos
- Nunca commitar `.env`
- `SYNC_SECRET` e `APP_INSTANCE_ID` devem existir
- Rotação de segredo deve ser possível (com cuidado)
- Logs sem dados sensíveis (não logar CPF completo, por exemplo)

## 8) Performance
- Índices no Postgres para consultas mensais e por cliente/produto
- No mobile:
  - queries locais otimizadas
  - listas paginadas quando necessário
- Evitar telas pesadas no primeiro carregamento

## 9) UI/UX
- Componentes grandes e poucos campos por tela
- Busca rápida e “recentes”
- Padrão de ações:
  - botão primário fixo (“Finalizar”, “Salvar”, “Receber”)
- Tooltips educativos para lucro bruto/líquido

## 10) Integrações permitidas
- Impressão ESC/POS via Bluetooth no Android (plugin nativo)
- Compartilhar PDF via share sheet (sem integração externa)
- Nada de integração bancária/WhatsApp API no escopo atual

## 11) Parâmetros configuráveis (Settings)
- Método de custo: FIFO ou Custo médio
- Tabelas de preço e padrão
- Dados do cupom (empresa, CNPJ/IE, telefones, etc.)
- Impressoras:
  - mini térmica Bluetooth (perfil)
  - impressora PC (A5)
- Unidades e conversões por produto (principalmente o ovo)