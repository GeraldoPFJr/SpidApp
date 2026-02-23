// ─── Enums ───────────────────────────────────────────────

export type Direction = 'IN' | 'OUT'

export type ReasonType =
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'LOSS'
  | 'CONSUMPTION'
  | 'DONATION'
  | 'RETURN'
  | 'INVENTORY_COUNT'

export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export type ReceivableStatus = 'OPEN' | 'PAID' | 'CANCELLED'

export type ReceivableKind = 'CREDIARIO' | 'BOLETO' | 'CHEQUE' | 'CARD_INSTALLMENT'

export type PaymentMethod =
  | 'CASH'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CREDIARIO'
  | 'BOLETO'
  | 'CHEQUE'

export type AccountType = 'CASH' | 'BANK' | 'OTHER'

export type FinanceEntryType = 'EXPENSE' | 'INCOME' | 'APORTE' | 'RETIRADA' | 'TRANSFER'

export type FinanceEntryStatus = 'SCHEDULED' | 'DUE' | 'PAID' | 'CANCELLED'

export type FinanceCategoryType = 'EXPENSE' | 'INCOME'

// ─── Catalogos ───────────────────────────────────────────

export interface Category {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Subcategory {
  id: string
  categoryId: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  code: string | null
  categoryId: string
  subcategoryId: string | null
  minStock: number | null
  active: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ProductUnit {
  id: string
  productId: string
  nameLabel: string
  factorToBase: number
  isSellable: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PriceTier {
  id: string
  name: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductPrice {
  id: string
  productId: string
  unitId: string
  tierId: string
  price: number
  createdAt: Date
  updatedAt: Date
}

// ─── Mestres ─────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  phone: string | null
  doc: string | null
  address: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  cnpj: string | null
  city: string | null
  productTypes: string | null
  minOrder: string | null
  paymentTerms: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// ─── Compras ─────────────────────────────────────────────

export interface Purchase {
  id: string
  supplierId: string
  date: Date
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId: string
  unitId: string
  qty: number
  unitCost: number
  totalCost: number
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseCost {
  id: string
  purchaseId: string
  label: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

// ─── Estoque ─────────────────────────────────────────────

export interface InventoryMovement {
  id: string
  productId: string
  date: Date
  direction: Direction
  qtyBase: number
  reasonType: ReasonType
  reasonId: string | null
  notes: string | null
  deviceId: string
  createdAt: Date
  updatedAt: Date
}

export interface CostLot {
  id: string
  productId: string
  purchaseItemId: string
  qtyRemainingBase: number
  unitCostBase: number
  createdAt: Date
  updatedAt: Date
}

// ─── Vendas ──────────────────────────────────────────────

export interface Sale {
  id: string
  customerId: string | null
  date: Date
  status: SaleStatus
  subtotal: number
  discount: number
  freight: number
  total: number
  couponNumber: number | null
  notes: string | null
  deviceId: string
  createdAt: Date
  updatedAt: Date
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  unitId: string
  qty: number
  unitPrice: number
  total: number
  createdAt: Date
  updatedAt: Date
}

// ─── Recebiveis ──────────────────────────────────────────

export interface Receivable {
  id: string
  saleId: string | null
  customerId: string
  dueDate: Date
  amount: number
  status: ReceivableStatus
  kind: ReceivableKind
  createdAt: Date
  updatedAt: Date
}

export interface ReceivableSettlement {
  id: string
  receivableId: string
  paymentId: string
  amount: number
  paidAt: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Pagamentos ──────────────────────────────────────────

export interface Payment {
  id: string
  saleId: string | null
  purchaseId: string | null
  date: Date
  method: PaymentMethod
  amount: number
  accountId: string
  cardType: string | null
  installments: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Financeiro ──────────────────────────────────────────

export interface Account {
  id: string
  name: string
  type: AccountType
  active: boolean
  defaultPaymentMethods: string[]
  createdAt: Date
  updatedAt: Date
}

export interface FinanceCategory {
  id: string
  type: FinanceCategoryType
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface FinanceEntry {
  id: string
  type: FinanceEntryType
  categoryId: string | null
  accountId: string
  amount: number
  dueDate: Date | null
  status: FinanceEntryStatus
  paidAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MonthlyClosure {
  id: string
  month: string
  accountId: string
  openingBalance: number
  expectedClosing: number
  countedClosing: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Offline/Sync ────────────────────────────────────────

export interface OutboxOperation {
  id: string
  operationId: string
  entityType: string
  action: string
  payload: unknown
  syncedAt: Date | null
  deviceId: string
  createdAt: Date
}

export interface SyncPushPayload {
  deviceId: string
  operations: Array<{
    operationId: string
    entityType: string
    action: string
    payload: unknown
  }>
}

export interface SyncPullResponse {
  cursor: string
  changes: Array<{
    entityType: string
    action: string
    data: unknown
    updatedAt: string
  }>
}
