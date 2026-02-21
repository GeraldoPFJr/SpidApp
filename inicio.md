# Sistema de Vendas Offline-First (Ovos + Mercearia) — Prompt Inicial
Data: 2026-02-21
Versão: 1.0

## 1) Missão
Criar um sistema simples e rápido (mobile-first) para um vendedor porta a porta e WhatsApp, capaz de operar 100% offline no celular, sincronizar com a nuvem (Neon Postgres) e permitir uso simultâneo no computador, com foco em:
- Vendas rápidas com cupom não fiscal (PDF + impressão térmica Bluetooth)
- Controle de estoque (entrada/saída) e inventário
- Crediário/boleto com parcelas flexíveis, pagamentos parciais e gestão de inadimplentes
- Financeiro: movimentações, contas (carteira/conta), despesas/receitas e fechamento mensal
- Dashboards e relatórios (mensal, por produto, ranking de clientes)

## 2) Usuário-alvo
- Único usuário (sem login/senha), usando:
  - Celular Android em campo (porta a porta, offline)
  - Computador em casa (web) para consultas e ajustes
- Volume aproximado:
  - ~50 produtos
  - Clientes pessoa física e jurídica

## 3) Objetivos (macro)
1. Registrar compras (entrada de estoque) com fornecedor, custos (frete/outros) e forma de pagamento; gerar contas a pagar quando compra for a prazo.
2. Registrar vendas com split de pagamentos (dinheiro/pix/cartão/crediário/cheque/boleto), desconto/acréscimo, e cupom não fiscal.
3. Resolver o “problema do ovo”: comprar em “caixa” e vender em “caixa/cartela/bandeja” abatendo corretamente o mesmo estoque.
4. Operar offline com filas de operações e sincronização posterior sem duplicar registros.
5. Controlar contas a receber (crediário/boleto/cheque) com parcelas dinâmicas e pagamentos parciais.
6. Exibir inadimplentes com alertas e ordenações.
7. Exibir dashboards e relatórios com lucro bruto/líquido (com tooltip explicativo do cálculo).

## 4) Não-objetivos (fora do escopo)
- Emissão de NFC-e / nota fiscal
- Integração bancária automática (Pix automático, conciliação bancária, API de banco)
- Importação de planilhas no início (cadastros serão manuais)
- Envio automático de WhatsApp por integração externa (apenas gerar PDF e usar “compartilhar”)

## 5) Regras críticas do produto
- Sem login/perfis (um único acesso com permissão total)
- Mobile-first: principais fluxos em até 3 cliques/ações
- Offline:
  - Deve permitir: vendas completas, baixa de estoque, criação de crediário/boleto, pagamentos parciais, despesas/receitas, inventário e impressão
  - Sincronizar quando voltar online
- Uso simultâneo (celular + PC):
  - Conflitos resolvidos por “última alteração vence” para cadastros
  - Movimentações (estoque e financeiro) devem ser idempotentes (não duplicar)

## 6) Métricas de sucesso
- Criar venda (com cupom) em < 30s para 80% das vendas
- Sincronização sem duplicidade (0 vendas duplicadas em cenários de offline/online)
- Estoque do ovo coerente (batendo com contagem) com poucos ajustes manuais
- Tela de inadimplentes reduzindo atrasos (visível e acionável)

## 7) Principais módulos/telas
- Dashboard
- Vendas (novo pedido, pedidos em aberto, lista, detalhes, cancelamento, imprimir/gerar PDF, recebimentos)
- Clientes
- Produtos (categoria/subcategoria/tags, preços por unidade e por tabela)
- Estoque (movimentações, inventário/contagem, ajustes, perdas/consumo/doação)
- Compras (fornecedor, itens, custos extras, pagamento/contas a pagar)
- Financeiro (contas, movimentações, despesas/receitas futuras, fechamento mensal)
- Inadimplentes (modal + lista completa)
- Configurações (dados do cupom, impressoras, método de custo FIFO/médio, unidades/conversões, tabelas de preço)