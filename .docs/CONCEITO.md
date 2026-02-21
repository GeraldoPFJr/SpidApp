# CONCEITO — Vendi

## Dominio
Sistema de vendas para vendedor autonomo de ovos e mercearia, operando porta a porta e via WhatsApp.

## Regras de Negocio Fundamentais

### Estoque
- Armazenado como movimentos (eventos), nunca como saldo mutavel
- Unidade base inteira (ex: 1 ovo). Conversao por fator configuravel
- FIFO ou Custo Medio (configuravel globalmente)
- Inventario gera ajuste automatico (AJUSTE_INVENTARIO)

### Vendas
- Rascunho (DRAFT) → Confirmada (CONFIRMED) → Cancelada (CANCELLED)
- Draft nao afeta estoque nem financeiro
- Confirmacao: abate estoque + gera cupom sequencial + registra financeiro
- Cancelamento: questionario obrigatorio (mercadoria + dinheiro) + reversoes

### Crediario e Parcelas
- Qualquer venda pode ter split de pagamentos
- Crediario/boleto/cheque suportam parcelamento dinamico
- Pagamentos parciais ao longo do tempo
- Quitacao encerra as parcelas

### Financeiro
- Contas (carteira, banco, outras)
- Movimentacoes por evento (venda, compra, aporte, retirada)
- Despesas/receitas futuras com lifecycle: SCHEDULED → DUE → PAID
- Fechamento mensal por conta com conferencia

### Offline
- Toda escrita no mobile persiste em SQLite + outbox_operations
- Sincronizacao idempotente por operationId (UUID)
- Conflitos: LWW para cadastros, append-only para movimentos
