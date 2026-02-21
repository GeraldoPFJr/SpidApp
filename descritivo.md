# Descritivo — Sistema de Vendas Offline-First (Ovos + Mercearia)
Data: 2026-02-21
Versão: 1.0

## 1) Visão geral
Aplicação mobile-first para vendedor único (porta a porta e WhatsApp) com:
- App Android (Capacitor) distribuído via APK, offline-first com SQLite
- Web (PC) para uso simultâneo e consultas, com UX responsivo
- Backend/API + Neon Postgres como fonte de verdade na nuvem
- Sincronização por fila de operações idempotentes
- Impressão térmica Bluetooth (GOOPJRT PT-260) via ESC/POS no Android
- Cupom não fiscal em PDF (WhatsApp) e impressão 60mm/80mm/A5

## 2) Stack escolhida
### 2.1 Mobile (Android)
- React + TypeScript
- Capacitor (Android)
- SQLite local (via plugin Capacitor SQLite)
- Fila offline (operations outbox) + sincronização
- Impressão Bluetooth: ESC/POS (plugin nativo / comunidade)

### 2.2 Web (PC)
- Next.js (React + TypeScript) OU React SPA (Vite) — preferir Next.js para melhor DX e rotas
- Consome a mesma API do backend
- Pode ter cache local, mas o “offline forte” é prioridade no Android

### 2.3 Backend
- Node.js + TypeScript (Fastify/NestJS)
- API REST (ou REST + WebSocket opcional para atualização em tempo real no PC)
- Autenticação: sem login; uso por “instalação” (ver Segurança)
- ORM: Prisma
- DB: Neon (Postgres)

## 3) Roadmap de funcionalidades (checklist)
- [ ] Cadastros: produtos, categorias/subcategorias, clientes, fornecedores
- [ ] Compras (entrada de estoque) + custos extras + contas a pagar
- [ ] Estoque por movimentações + inventário/contagem + perdas/consumo/doação + tipos editáveis
- [ ] Vendas: rascunho (pedido em aberto) vs finalizada
- [ ] Split de pagamentos + crediário/boleto/cheque com parcelas dinâmicas
- [ ] Pagamentos parciais e quitação
- [ ] Cancelamento com questionário (dinheiro/mercadoria)
- [ ] Inadimplentes: modal ao abrir + tela completa com ordenações
- [ ] Financeiro: contas (carteira/conta + criar), movimentações, despesas/receitas futuras, aportes/retiradas, fechamento mensal
- [ ] Cupom não fiscal: PDF + impressão 60/80/A5
- [ ] Dashboards e relatórios (mensal / por produto / ranking clientes)
- [ ] Offline sync robusto (celular) + uso simultâneo com web
- [ ] Testes, logs, backup operacional

## 4) Requisitos funcionais detalhados

### 4.1 Produtos
**Campos:**
- Nome (obrigatório)
- Código interno (opcional; pode ser auto-gerado)
- Categoria (obrigatório)
- Subcategoria (opcional)
- Tags (opcional)
- Unidade base interna (ex.: “OVO” ou “UN_BASE”)
- Unidades vendáveis (embalagens) com conversão para a unidade base
- Estoque mínimo (opcional)
- Ativo/inativo

**Preços:**
- Suporte a múltiplas “tabelas de preço” (ex.: Varejo, Atacado, Cliente Especial)
- Preços por unidade vendável (ex.: Bandeja, Cartela, Caixa) e por tabela

**Conversões (resolver o ovo):**
- Todo estoque é armazenado em “unidade base” (inteiro).
- Cada produto define “unidades vendáveis” com fator:
  - Bandeja = 12 (configurável)
  - Cartela = 30 (configurável)
  - Caixa = configurável (existe conflito informado: 240 vs 12×30=360). O sistema deve permitir editar e salvar o valor correto do seu fornecedor.
- Compra pode ser lançada em “Caixa/Cartela/Bandeja” e o sistema converte para base.
- Venda baixa o estoque convertendo a unidade vendida para base.
- Tela de estoque deve mostrar:
  - saldo em unidade base
  - “quantos eu consigo vender” em cada embalagem (ex.: X caixas, Y cartelas, Z bandejas) com cálculo automático.

### 4.2 Clientes
- Nome (obrigatório)
- Telefone (opcional)
- Documento (CPF/CNPJ opcional)
- Endereço (opcional)
- Observações (opcional)
- Tipo: PF / PJ (derivado ou selecionável)

### 4.3 Fornecedores
- Nome (obrigatório)
- Telefone
- CNPJ
- Cidade
- Tipo de produtos que vende
- Pedido mínimo
- Forma de pagamento (texto/enum)
- Observação

### 4.4 Compras (entrada de estoque)
- Cabeçalho: fornecedor, data, observação
- Itens: produto, unidade (embalagem), quantidade, custo unitário, desconto/acréscimo por item (opcional)
- Custos extras: frete, taxa, outros (lançados como “custo adicional” da compra)
- Forma de pagamento:
  - À vista (gera saída imediata no financeiro)
  - A prazo (boleto/crediário/cheque) → gera **contas a pagar** com vencimentos/parcelas
- Ao confirmar compra:
  - cria movimentações de estoque “ENTRADA_COMPRA”
  - calcula custo do lote para FIFO (se ativado)
  - registra transação financeira (se pago) ou contas a pagar (se a prazo)

### 4.5 Estoque e inventário
**Movimentações:**
- Entrada: compra, ajuste, devolução
- Saída: venda, perda, consumo próprio, doação, ajuste
- Tipos devem ser editáveis/criáveis (catálogo de “motivos”)

**Inventário/Contagem:**
- Selecionar produto(s)
- Informar contagem real por unidade vendável (opcional) e/ou base
- Sistema calcula diferença e gera movimentação “AJUSTE_INVENTARIO”
- Histórico de inventários por data

### 4.6 Vendas
**Pedido em aberto (rascunho):**
- É um rascunho em edição no celular
- Não abate estoque
- Pode ser salvo e retomado
- Ao finalizar, vira venda confirmada

**Venda confirmada:**
- Abate estoque imediatamente
- Gera cupom sequencial
- Pode ter:
  - desconto/acréscimo no total
  - desconto por item
  - frete/entrega (opcional)
- Split de pagamentos (qualquer combinação):
  - Dinheiro, Pix, Cartão (crédito/débito), Crediário, Boleto, Cheque
- Crediário/Boleto/Cheque:
  - Podem ser “à vista” (1 vencimento) ou parcelados
  - Parcelamento inteligente:
    - número de parcelas (N)
    - intervalo em dias (ex.: 7/15/30) OU regra “mesmo dia do mês”/“mesmo dia da semana”
- Cartão de crédito parcelado:
  - número de parcelas (N)
  - não precisa digitar intervalo (assumir mensal, mantendo datas geradas automaticamente)
- Pagamento parcial:
  - registrar pagamentos ao longo do tempo
  - quitação encerra a(s) parcela(s)
- Alerta de inadimplente:
  - ao selecionar cliente inadimplente, exibir alerta (não bloqueia)

### 4.7 Cancelamento de venda (a qualquer momento)
Ao cancelar:
- Abrir questionário obrigatório:
  - O que foi feito com a mercadoria?
    - devolvida ao estoque (gera movimentação de entrada)
    - ficou como crédito para o cliente (não volta ao estoque; gera “crédito do cliente”)
    - perda/estrago (gera movimentação de saída específica)
    - outro (texto)
  - O que foi feito com o dinheiro?
    - devolvido (gera saída financeira)
    - ficou como crédito
    - estorno em cartão (registro)
    - outro
- Venda muda status para CANCELADA
- Todas as reversões devem ser rastreáveis e idempotentes

### 4.8 Financeiro
**Contas (accounts):**
- Padrões:
  - Carteira (Dinheiro)
  - Conta (Pix)
- Usuário pode criar outras contas (ex.: Cartão, Cheques a receber, etc.)
- Tipos: CASH, BANK, RECEIVABLE_HOLD (opcional)

**Lançamentos:**
- Movimentações (entrada/saída) com categoria e conta
- Despesas e receitas futuras:
  - Possuem vencimento
  - Status: AGENDADA → ao chegar a data vira VENCIDA (se não foi marcada como PAGA/RECEBIDA)
  - Não “vira outro registro”; o mesmo registro muda de status
- Aportes e retiradas:
  - mesmos campos de despesa, mas com tipo específico (APORTE/RETIRADA)
- Fechamento mensal:
  - por conta: saldo inicial, entradas, saídas, saldo final esperado, saldo conferido
  - registrar divergência e observações

### 4.9 Inadimplência e alertas
- Ao abrir o sistema (app/web), se houver inadimplentes:
  - exibir **modal** com lista resumida
- Tela “Inadimplentes” completa:
  - ordenar por data, dias vencidos, valor
  - exibir: nome, valor em aberto, qtd notas em aberto, dias em atraso, última compra
- Notificações:
  - Dentro do app (sempre)
  - Notificação do Android (se simples): opcional via agendamento local (sem integrações externas)

### 4.10 Dashboards e relatórios
**Dashboard mensal (mês atual):**
- Faturamento
- Lucro bruto e lucro líquido
- Quantidade de vendas
- Clientes novos
- Ticket médio
- Recebido vs a receber
- Despesas do mês
- Tooltip educativo em qualquer lugar que mostre lucro:
  - Lucro bruto = vendas – custo do produto
  - Lucro líquido = receitas – custo do produto – rateio das despesas

**Fluxo de caixa (mensal):**
- por conta e consolidado
- entradas/saídas por categoria
- saldo diário (opcional) e resumo do mês

**Desempenho por produto:**
- lista ordenável por faturamento ou lucro
- colunas: faturamento, lucro, itens vendidos, clientes únicos

**Grid últimos 3 meses por produto:**
- linhas = produtos
- colunas = M-2, M-1, M
- valores alternáveis: faturamento ↔ lucro

**Ranking de clientes (últimos 3 meses):**
- total comprado, lucro, quantidade de vendas, prazo médio de pagamento
- prazo médio:
  - dinheiro/pix/cartão (crédito/débito) = 0 dia
  - crediário/boleto/cheque = dias entre data da venda e data de quitação

**Rateio de despesas (para lucro líquido por produto):**
- método escolhido: proporcional ao faturamento do produto no mês

## 5) Método de custo (configurável)
Configuração global:
- FIFO (padrão recomendado)
- Custo médio (alternativa)

Regras:
- FIFO: compras geram lotes; vendas consomem lotes na ordem
- Custo médio: recalcula custo médio após cada entrada; COGS usa custo médio vigente

## 6) Cupom não fiscal (modelo)
Baseado no layout enviado, mantendo todos os campos:
- Cabeçalho: Nome fantasia, razão social, endereço, cidade/UF/CEP, telefones
- CNPJ e IE
- Cliente: nome (ou “CONSUMIDOR FINAL”)
- Data/hora
- “COMPROVANTE DE VENDA” e “N° 000001” (sequencial único crescente)
- Tabela itens com:
  - Código
  - Descrição
  - QTD x UNIT
  - Garantia
  - R$ Valor
- Totais: Total da Nota, Valor Recebido, Troco
- Forma de pagamento
- Tabela de pagamentos (data pgto, valor, tipo pgto)
- Vendedor (fixo)
- Números de série (se houver; se não, imprimir “—”)
- Texto de aceite + assinatura
- Rodapé “OBRIGADO E VOLTE SEMPRE”

Saídas:
- PDF (para WhatsApp/compartilhar)
- Impressão:
  - térmica 60mm e 80mm (ESC/POS)
  - A5 (PDF)

Configurações:
- selecionar rapidamente: 60mm / 80mm / A5 / PDF
- cadastrar 2 perfis de impressora:
  - Mini térmica Bluetooth (GOOPJRT PT-260)
  - Impressora “grande” no PC (A5)

## 7) Arquitetura (alto nível)

### 7.1 Componentes
- Mobile (SQLite + Queue)
- Web (online-first)
- Backend API
- Neon Postgres

### 7.2 Offline Sync (modelo)
- Cada dispositivo tem um `deviceId`
- Escritas offline geram registros em `outbox_operations`
- Operações são enviadas para `/sync/push`
- Server aplica com idempotência por `operationId`
- Server retorna mudanças desde o último cursor em `/sync/pull`
- Conflitos:
  - Cadastros (produto/cliente/fornecedor): last-write-wins por `updatedAt`
  - Movimentações (estoque/financeiro/pagamentos): append-only + idempotência (sem conflito)

## 8) Modelo de dados (Postgres)
### 8.1 Entidades principais (resumo)
- categories (id, name)
- subcategories (id, category_id, name)
- products (id, name, sku/code, category_id, subcategory_id, min_stock, active, created_at, updated_at, deleted_at)
- product_units (id, product_id, name_label, factor_to_base INT, is_sellable BOOL, sort_order)
- price_tiers (id, name, is_default)
- product_prices (id, product_id, unit_id, tier_id, price NUMERIC)
- customers (id, name, phone, doc, address, notes, created_at, updated_at, deleted_at)
- suppliers (id, name, phone, cnpj, city, product_types, min_order, payment_terms, notes, created_at, updated_at, deleted_at)
- purchases (id, supplier_id, date, notes, status)
- purchase_items (id, purchase_id, product_id, unit_id, qty, unit_cost, total_cost)
- purchase_costs (id, purchase_id, label, amount)
- inventory_movements (id, product_id, date, direction IN/OUT, qty_base INT, reason_type, reason_id, notes, device_id)
- cost_lots (id, product_id, purchase_item_id, qty_remaining_base, unit_cost_base, created_at)  // para FIFO
- sales (id, customer_id, date, status DRAFT/CONFIRMED/CANCELLED, subtotal, discount, surcharge, freight, total, coupon_number, notes, device_id)
- sale_items (id, sale_id, product_id, unit_id, qty, unit_price, total)
- receivables (id, sale_id, customer_id, due_date, amount, status OPEN/PAID/CANCELLED, kind CREDIARIO/BOLETO/CHEQUE/CARD_INSTALLMENT)
- receivable_settlements (id, receivable_id, payment_id, amount, paid_at)
- payments (id, sale_id NULL, purchase_id NULL, date, method, amount, account_id, card_type NULL, notes)
- accounts (id, name, type CASH/BANK/OTHER, active)
- finance_categories (id, type EXPENSE/INCOME, name)
- finance_entries (id, type EXPENSE/INCOME/APORTE/RETIRADA/TRANSFER, category_id, account_id, amount, due_date, status SCHEDULED/DUE/PAID/CANCELLED, paid_at, notes)
- monthly_closures (id, month, account_id, opening_balance, expected_closing, counted_closing, notes)

### 8.2 Índices (mínimos)
- sales(date), sales(customer_id), sales(status)
- receivables(status, due_date), receivables(customer_id)
- inventory_movements(product_id, date)
- purchase(date), purchase(supplier_id)
- product_prices(product_id, tier_id, unit_id)

## 9) API (resumo)
- /sync/push (POST): enviar operações offline
- /sync/pull (GET): buscar alterações desde cursor
- CRUD: /products, /customers, /suppliers, /sales, /purchases, /inventory, /finance
- Relatórios: /reports/dashboard?month=YYYY-MM, /reports/products-3m, /reports/customers-3m, /reports/cashflow?month=...

## 10) Setup local (dev)
### 10.1 Variáveis de ambiente (exemplo)
```env
DATABASE_URL=postgresql://...
SYNC_SECRET=...   # usado para assinar operações do dispositivo (simples)
APP_INSTANCE_ID=...  # identificador da instalação

10.2 Rodar

Backend: pnpm dev (API)

Web: pnpm dev (Next)

Mobile:

pnpm build

npx cap sync android

gerar APK debug/release conforme pipeline

11) Segurança e LGPD (mínimo necessário)

Dados sensíveis:

telefone, endereço, doc (CPF/CNPJ)

Práticas:

TLS no tráfego

Segredos em .env, nunca versionar

Soft-delete e trilhas de auditoria para cancelamentos

Sem login:

usar “instalação” com APP_INSTANCE_ID e SYNC_SECRET para evitar que qualquer cliente aleatório sincronize (não é segurança perfeita, mas reduz risco)

permitir reset/rotação do secret em Configurações (com cuidado)

12) Critérios de UX

Fluxo de venda em 3 etapas:

Cliente (ou “Consumidor final”) + itens

Pagamento (split + crediário/parcelas)

Finalizar + Cupom (imprimir/gerar PDF)

Telas com ações primárias grandes (uso em rua)

Pesquisa rápida de produtos e cliente

Preferências salvas: tabela de preço padrão, último formato de impressão, última conta usada