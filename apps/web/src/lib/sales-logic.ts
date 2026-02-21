import type { PrismaClient } from '@prisma/client'
import {
  convertToBase,
  generateInstallments,
  generateCouponNumber,
} from '@spid/shared/utils/index.js'

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const IMMEDIATE_METHODS = ['CASH', 'PIX', 'DEBIT_CARD']

interface SaleItem {
  productId: string
  unitId: string
  qty: number
  unitPrice: number
  total: number
}

interface SalePayment {
  method: string
  amount: number
  accountId: string
  cardType?: string | null
  installments?: number | null
  installmentIntervalDays?: number | null
}

async function getNextCouponNumber(tx: TxClient): Promise<number> {
  const lastSale = await tx.sale.findFirst({
    where: { couponNumber: { not: null } },
    orderBy: { couponNumber: 'desc' },
    select: { couponNumber: true },
  })
  return generateCouponNumber(lastSale?.couponNumber ?? 0)
}

async function consumeFIFO(
  tx: TxClient,
  productId: string,
  qtyBase: number,
): Promise<number> {
  const lots = await tx.costLot.findMany({
    where: { productId, qtyRemainingBase: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  })

  let remaining = qtyBase
  let totalCost = 0

  for (const lot of lots) {
    if (remaining <= 0) break

    const take = Math.min(lot.qtyRemainingBase, remaining)
    const cost = take * Number(lot.unitCostBase)
    totalCost += cost
    remaining -= take

    await tx.costLot.update({
      where: { id: lot.id },
      data: { qtyRemainingBase: lot.qtyRemainingBase - take },
    })
  }

  return totalCost
}

async function processImmediatePayment(
  tx: TxClient,
  saleId: string,
  saleDate: Date,
  couponNumber: number,
  pmt: SalePayment,
) {
  await tx.payment.create({
    data: {
      saleId,
      date: saleDate,
      method: pmt.method,
      amount: pmt.amount,
      accountId: pmt.accountId,
      cardType: pmt.cardType,
    },
  })

  await tx.financeEntry.create({
    data: {
      type: 'INCOME',
      accountId: pmt.accountId,
      amount: pmt.amount,
      status: 'PAID',
      paidAt: saleDate,
      notes: `Venda cupom #${couponNumber}`,
    },
  })
}

async function processCardInstallments(
  tx: TxClient,
  saleId: string,
  customerId: string,
  saleDate: Date,
  pmt: SalePayment,
) {
  const installments = generateInstallments(
    pmt.amount,
    pmt.installments!,
    30,
    saleDate,
  )

  for (const inst of installments) {
    await tx.receivable.create({
      data: {
        saleId,
        customerId,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: 'OPEN',
        kind: 'CARD_INSTALLMENT',
      },
    })
  }
}

async function processCreditPayment(
  tx: TxClient,
  saleId: string,
  customerId: string,
  saleDate: Date,
  pmt: SalePayment,
) {
  const count = pmt.installments ?? 1
  const intervalDays = pmt.installmentIntervalDays ?? 30
  const installments = generateInstallments(pmt.amount, count, intervalDays, saleDate)

  const kindMap: Record<string, string> = {
    CREDIARIO: 'CREDIARIO',
    BOLETO: 'BOLETO',
    CHEQUE: 'CHEQUE',
  }

  for (const inst of installments) {
    await tx.receivable.create({
      data: {
        saleId,
        customerId,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: 'OPEN',
        kind: kindMap[pmt.method] ?? 'CREDIARIO',
      },
    })
  }
}

export async function confirmSale(
  tx: TxClient,
  saleId: string,
  items: SaleItem[],
  payments: SalePayment[] | undefined,
  saleDate: Date,
  customerId: string | null | undefined,
  deviceId: string,
) {
  // 1. Inventory movements + FIFO for each item
  for (const item of items) {
    const unit = await tx.productUnit.findUnique({ where: { id: item.unitId } })
    if (!unit) throw new Error(`Unit ${item.unitId} not found`)

    const qtyBase = convertToBase(item.qty, unit.factorToBase)

    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        date: saleDate,
        direction: 'OUT',
        qtyBase,
        reasonType: 'SALE',
        reasonId: saleId,
        deviceId,
      },
    })

    await consumeFIFO(tx, item.productId, qtyBase)
  }

  // 2. Generate coupon number
  const couponNumber = await getNextCouponNumber(tx)
  await tx.sale.update({
    where: { id: saleId },
    data: { status: 'CONFIRMED', couponNumber },
  })

  // 3. Process payments
  if (!payments?.length) return

  for (const pmt of payments) {
    const isImmediate = IMMEDIATE_METHODS.includes(pmt.method)
    const isCreditNoInstallments = pmt.method === 'CREDIT_CARD'
      && (!pmt.installments || pmt.installments <= 1)

    if (isImmediate || isCreditNoInstallments) {
      await processImmediatePayment(tx, saleId, saleDate, couponNumber, pmt)
    } else if (pmt.method === 'CREDIT_CARD' && pmt.installments && pmt.installments > 1) {
      if (!customerId) throw new Error('Customer required for installment payments')
      await processCardInstallments(tx, saleId, customerId, saleDate, pmt)
    } else {
      if (!customerId) throw new Error('Customer required for credit payments')
      await processCreditPayment(tx, saleId, customerId, saleDate, pmt)
    }
  }
}
