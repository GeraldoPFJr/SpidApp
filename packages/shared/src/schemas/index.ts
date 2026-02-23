import { z } from 'zod'

export * from './auth'

// ─── Produtos ────────────────────────────────────────────

const productUnitSchema = z.object({
  nameLabel: z.string().min(1),
  factorToBase: z.number().int().positive(),
  isSellable: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
})

const productPriceSchema = z.object({
  unitId: z.string().uuid(),
  tierId: z.string().uuid(),
  price: z.number().nonnegative(),
})

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).nullish(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().nullish(),
  minStock: z.number().int().nonnegative().nullish(),
  active: z.boolean().default(true),
  units: z.array(productUnitSchema).min(1),
  prices: z.array(productPriceSchema).optional(),
})

const productUnitUpdateSchema = productUnitSchema.extend({
  id: z.string().uuid().optional(),
})

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
  units: z.array(productUnitUpdateSchema).optional(),
  prices: z.array(productPriceSchema).optional(),
})

// ─── Clientes ────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).nullish(),
  doc: z.string().max(20).nullish(),
  address: z.string().max(500).nullish(),
  notes: z.string().max(1000).nullish(),
  type: z.enum(['PF', 'PJ']).default('PF'),
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Fornecedores ────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).nullish(),
  cnpj: z.string().max(20).nullish(),
  city: z.string().max(100).nullish(),
  productTypes: z.string().max(500).nullish(),
  minOrder: z.string().max(200).nullish(),
  paymentTerms: z.string().max(200).nullish(),
  notes: z.string().max(1000).nullish(),
})

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Compras ─────────────────────────────────────────────

const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  qty: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
})

const purchaseCostSchema = z.object({
  label: z.string().min(1).max(100),
  amount: z.number().nonnegative(),
})

export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  date: z.coerce.date(),
  notes: z.string().max(1000).nullish(),
  status: z.string().default('CONFIRMED'),
  items: z.array(purchaseItemSchema).min(1),
  costs: z.array(purchaseCostSchema).optional(),
  payments: z
    .array(
      z.object({
        method: z.string(),
        amount: z.number().nonnegative(),
        accountId: z.string().uuid(),
      }),
    )
    .optional(),
})

// ─── Vendas ──────────────────────────────────────────────

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

const salePaymentSchema = z.object({
  method: z.enum([
    'CASH',
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'CREDIARIO',
    'BOLETO',
    'CHEQUE',
  ]),
  amount: z.number().nonnegative(),
  accountId: z.string().uuid(),
  cardType: z.string().nullish(),
  installments: z.number().int().positive().nullish(),
  installmentIntervalDays: z.number().int().positive().nullish(),
})

export const createSaleSchema = z.object({
  customerId: z.string().uuid().nullish(),
  date: z.coerce.date(),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  freight: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  notes: z.string().max(1000).nullish(),
  deviceId: z.string(),
  items: z.array(saleItemSchema).min(1),
  payments: z.array(salePaymentSchema).optional(),
})

// ─── Financeiro ──────────────────────────────────────────

export const createFinanceEntrySchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'APORTE', 'RETIRADA', 'TRANSFER']),
  categoryId: z.string().uuid().nullish(),
  accountId: z.string().uuid(),
  amount: z.number().nonnegative(),
  dueDate: z.coerce.date().nullish(),
  status: z.enum(['SCHEDULED', 'DUE', 'PAID', 'CANCELLED']).default('SCHEDULED'),
  paidAt: z.coerce.date().nullish(),
  notes: z.string().max(1000).nullish(),
})

// ─── Sync ────────────────────────────────────────────────

export const syncPushSchema = z.object({
  deviceId: z.string().min(1),
  operations: z
    .array(
      z.object({
        operationId: z.string().uuid(),
        entityType: z.string().min(1),
        action: z.string().min(1),
        payload: z.unknown(),
      }),
    )
    .min(1),
})

// ─── Inferred Types ──────────────────────────────────────

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type CreateFinanceEntryInput = z.infer<typeof createFinanceEntrySchema>
export type SyncPushInput = z.infer<typeof syncPushSchema>
