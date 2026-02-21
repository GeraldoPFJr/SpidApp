import type { CostLot } from '../types/index'

/**
 * Converte quantidade de unidade vendavel para unidade base.
 * Ex: 2 bandejas (fator 12) = 24 unidades base
 */
export function convertToBase(qty: number, factor: number): number {
  return Math.round(qty * factor)
}

/**
 * Converte quantidade de unidade base para unidade vendavel.
 * Ex: 24 unidades base / fator 12 = 2 bandejas
 */
export function convertFromBase(qtyBase: number, factor: number): number {
  if (factor === 0) return 0
  return qtyBase / factor
}

/**
 * Gera array de parcelas com datas de vencimento.
 */
export function generateInstallments(
  total: number,
  count: number,
  intervalDays: number,
  startDate: Date,
): Array<{ dueDate: Date; amount: number }> {
  if (count <= 0) return []

  const baseAmount = Math.floor((total / count) * 100) / 100
  const remainder = Math.round((total - baseAmount * count) * 100) / 100

  return Array.from({ length: count }, (_, i) => {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + intervalDays * (i + 1))

    const amount = i === count - 1 ? baseAmount + remainder : baseAmount

    return { dueDate, amount }
  })
}

/**
 * Consome lotes FIFO e retorna custo total.
 * Modifica os lotes in-place (reduz qty_remaining_base).
 */
export function calculateFIFOCost(
  lots: Array<Pick<CostLot, 'qtyRemainingBase' | 'unitCostBase'>>,
  qtyNeeded: number,
): { totalCost: number; consumed: Array<{ lotIndex: number; qty: number; cost: number }> } {
  let remaining = qtyNeeded
  let totalCost = 0
  const consumed: Array<{ lotIndex: number; qty: number; cost: number }> = []

  for (let i = 0; i < lots.length && remaining > 0; i++) {
    const lot = lots[i]
    if (!lot || lot.qtyRemainingBase <= 0) continue

    const take = Math.min(lot.qtyRemainingBase, remaining)
    const cost = take * lot.unitCostBase
    totalCost += cost
    remaining -= take
    lot.qtyRemainingBase -= take

    consumed.push({ lotIndex: i, qty: take, cost })
  }

  return { totalCost, consumed }
}

/**
 * Recalcula custo medio ponderado apos nova entrada.
 */
export function calculateAverageCost(
  currentAvg: number,
  currentQty: number,
  newCost: number,
  newQty: number,
): number {
  const totalQty = currentQty + newQty
  if (totalQty === 0) return 0
  return (currentAvg * currentQty + newCost * newQty) / totalQty
}

/**
 * Formata valor numerico para moeda BRL.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Gera proximo numero de cupom sequencial.
 */
export function generateCouponNumber(lastNumber: number): number {
  return lastNumber + 1
}
