
---

## TaskList.md

```md
# TaskList — Sistema de Vendas Offline-First (Ovos + Mercearia)
Data: 2026-02-21
Versão: 1.0

## Sprint atual (Prioridade Máxima)
### Fundação (repo + arquitetura)
- [ ] Definir monorepo (apps/mobile, apps/web, apps/api, packages/shared)
- [ ] Configurar TypeScript, lint, format, env validation
- [ ] Configurar Prisma + Neon + migrations
- [ ] Estrutura de UI compartilhada (design system simples)

### Offline-first (mobile)
- [ ] Integrar SQLite no Capacitor (schema local)
- [ ] Implementar outbox_operations (fila local)
- [ ] Implementar sync: push (idempotência) + pull (cursor)
- [ ] Estratégia de conflitos (cadastros LWW + movimentos append-only)
- [ ] Testes de cenários:
  - venda offline → sync
  - venda offline + ajuste web online → sync
  - duplicidade (reenvio) não duplica

### Produtos e conversões (ovo)
- [ ] CRUD de categorias/subcategorias
- [ ] CRUD de produtos com:
  - unidades vendáveis (bandeja/cartela/caixa) e fatores configuráveis
  - estoque mínimo opcional
- [ ] Tabelas de preço (tiers) + preços por unidade
- [ ] Cálculo “quantos consigo vender” por embalagem

### Compras e estoque
- [ ] Cadastro de fornecedores (campos completos)
- [ ] Cadastro de compra (itens + custos extras)
- [ ] Geração de movimentação de estoque (entrada)
- [ ] Implementar método de custo:
  - FIFO (lotes)
  - Custo médio
  - Configuração em Settings

### Vendas (rascunho vs confirmada)
- [ ] Fluxo “pedido em aberto” (draft) sem baixar estoque
- [ ] Finalização da venda baixa estoque e gera cupom sequencial
- [ ] Split de pagamento (dinheiro/pix/cartão/crediário/boleto/cheque)
- [ ] Parcelamento inteligente:
  - N parcelas
  - intervalo em dias OU regra por mês/semana
  - cartão crédito parcelado
- [ ] Pagamento parcial (recebimentos)
- [ ] Alerta de inadimplente ao selecionar cliente

### Cancelamento de venda
- [ ] Tela/fluxo de cancelamento com questionário:
  - destino mercadoria (volta estoque / crédito / perda / outro)
  - destino dinheiro (devolvido / crédito / estorno / outro)
- [ ] Reversões:
  - estoque (movimentação)
  - financeiro (lançamentos) quando aplicável
- [ ] Auditoria: registrar motivo e usuário/dispositivo

### Financeiro
- [ ] Contas: carteira/conta + CRUD de contas
- [ ] Categorias de despesa/receita editáveis
- [ ] Despesas/receitas futuras (status SCHEDULED→DUE→PAID)
- [ ] Aportes e retiradas
- [ ] Contas a pagar geradas por compras a prazo
- [ ] Fechamento mensal (por conta)

### Inadimplentes
- [ ] Modal ao abrir se houver inadimplentes
- [ ] Tela lista com ordenações (data/dias/valor)
- [ ] Colunas: nome, valor em aberto, qtd notas, dias atraso, última compra
- [ ] Atalho para registrar recebimento

### Cupom e impressão
- [ ] Gerador de cupom PDF (A5 + layout completo)
- [ ] Templates térmicos 60mm/80mm (monoespaçado) com seleção rápida
- [ ] Plugin ESC/POS Bluetooth (GOOPJRT PT-260) no Android
- [ ] Fluxo “Compartilhar PDF” (WhatsApp) via share sheet
- [ ] Impressão no PC (baixar PDF e imprimir)

### Dashboard e relatórios
- [ ] Dashboard mensal:
  - faturamento, lucro bruto, lucro líquido, vendas, clientes novos, ticket médio
- [ ] Tooltip educativo do cálculo de lucros
- [ ] Desempenho por produto (ordenar faturamento/lucro)
- [ ] Grid 3 meses por produto (alternar faturamento↔lucro)
- [ ] Ranking clientes 3 meses (inclui prazo médio)

## Concluídas
- (vazio)

## Backlog
- [ ] Exportação CSV/PDF de relatórios
- [ ] Alertas Android agendados para vencimentos (notificação local)
- [ ] Modo “Catálogo rápido” para venda com favoritos
- [ ] Impressão com logo e QR (opcional)

## Bugs
- (vazio)
