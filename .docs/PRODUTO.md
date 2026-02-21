# PRODUTO — Vendi

## Modulos/Telas Principais
1. **Dashboard** — faturamento, lucro bruto/liquido, vendas, ticket medio, recebido vs a receber
2. **Vendas** — novo pedido, pedidos em aberto, lista, detalhes, cancelamento, cupom/PDF
3. **Clientes** — CRUD + alerta inadimplencia
4. **Produtos** — categorias, unidades vendaveis, tabelas de preco
5. **Estoque** — movimentacoes, inventario, ajustes, perdas
6. **Compras** — fornecedor, itens, custos extras, contas a pagar
7. **Financeiro** — contas, movimentacoes, despesas/receitas futuras, fechamento mensal
8. **Inadimplentes** — modal ao abrir + lista com ordenacoes
9. **Configuracoes** — dados cupom, impressoras, metodo custo, unidades, tabelas preco

## UX Criticos
- Fluxo venda: 3 etapas (Cliente+Itens → Pagamento → Cupom)
- Botoes grandes (uso em rua com toque impreciso)
- Pesquisa rapida + recentes
- Selecao rapida de formato impressao (60mm/80mm/A5/PDF)
- Tooltip educativo em calculos de lucro

## Metricas de Sucesso
- Criar venda com cupom em < 30s (80% das vendas)
- Zero duplicatas na sincronizacao
- Estoque coerente com contagem fisica
