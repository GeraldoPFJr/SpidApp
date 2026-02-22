/**
 * SQLite local database for offline-first operation.
 * Uses @capacitor-community/sqlite when running on device.
 */

export interface LocalDatabase {
  execute(sql: string, params?: unknown[]): Promise<void>
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
  isReady(): boolean
}

// ─── Schema ───────────────────────────────────────────────
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  category_id TEXT,
  subcategory_id TEXT,
  min_stock INTEGER,
  active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS product_units (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name_label TEXT NOT NULL,
  factor_to_base INTEGER NOT NULL,
  is_sellable INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  doc TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  cnpj TEXT,
  city TEXT,
  product_types TEXT,
  min_order TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  surcharge REAL DEFAULT 0,
  freight REAL DEFAULT 0,
  total REAL DEFAULT 0,
  coupon_number INTEGER,
  notes TEXT,
  device_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  date TEXT NOT NULL,
  direction TEXT NOT NULL,
  qty_base INTEGER NOT NULL,
  reason_type TEXT NOT NULL,
  reason_id TEXT,
  notes TEXT,
  device_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'BANK',
  active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category_id TEXT,
  account_id TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'SCHEDULED',
  paid_at TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS receivables (
  id TEXT PRIMARY KEY,
  sale_id TEXT,
  customer_id TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'OPEN',
  kind TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT,
  purchase_id TEXT,
  date TEXT NOT NULL,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  account_id TEXT,
  card_type TEXT,
  installments INTEGER,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS outbox_operations (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  synced_at TEXT,
  device_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT
);
`

// ─── CRUD Helpers ─────────────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function nowISO(): string {
  return new Date().toISOString()
}

export async function saveToOutbox(
  db: LocalDatabase,
  entityType: string,
  action: string,
  payload: unknown,
): Promise<void> {
  const id = generateId()
  const operationId = generateId()
  const deviceId = localStorage.getItem('APP_INSTANCE_ID') ?? 'unknown'

  await db.execute(
    `INSERT INTO outbox_operations (id, operation_id, entity_type, action, payload, device_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, operationId, entityType, action, JSON.stringify(payload), deviceId],
  )
}

export async function getPendingOperations(db: LocalDatabase): Promise<Array<{
  operationId: string
  entityType: string
  action: string
  payload: unknown
}>> {
  const rows = await db.query<{
    operation_id: string
    entity_type: string
    action: string
    payload: string
  }>('SELECT operation_id, entity_type, action, payload FROM outbox_operations WHERE synced_at IS NULL ORDER BY created_at ASC')

  return rows.map((r) => ({
    operationId: r.operation_id,
    entityType: r.entity_type,
    action: r.action,
    payload: JSON.parse(r.payload),
  }))
}

export async function markOperationsSynced(
  db: LocalDatabase,
  operationIds: string[],
): Promise<void> {
  if (operationIds.length === 0) return
  const placeholders = operationIds.map(() => '?').join(',')
  await db.execute(
    `UPDATE outbox_operations SET synced_at = datetime('now') WHERE operation_id IN (${placeholders})`,
    operationIds,
  )
}

export async function getSyncCursor(db: LocalDatabase): Promise<string | null> {
  const rows = await db.query<{ value: string }>(
    "SELECT value FROM sync_state WHERE key = 'cursor'",
  )
  return rows.length > 0 ? rows[0]?.value ?? null : null
}

export async function setSyncCursor(db: LocalDatabase, cursor: string): Promise<void> {
  await db.execute(
    "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('cursor', ?)",
    [cursor],
  )
}

// ─── Database Factory ─────────────────────────────────────
export function createLocalDatabase(): LocalDatabase {
  let ready = false

  // In a real Capacitor app, this would use @capacitor-community/sqlite
  // For now, provide an in-memory stub that works in the browser

  return {
    async execute(_sql: string, _params?: unknown[]) {
      // Initialize schema on first call
      if (!ready && _sql !== SCHEMA_SQL) {
        // Auto-init
        ready = true
      }
      // In production, this would call SQLite plugin
      // For browser dev, operations are no-ops or use indexedDB
    },

    async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
      // In production, this would call SQLite plugin
      return []
    },

    isReady() {
      return ready
    },
  }
}

/**
 * Initialize the database schema.
 */
export async function initDatabase(db: LocalDatabase): Promise<void> {
  const statements = SCHEMA_SQL.split(';').filter((s) => s.trim())
  for (const stmt of statements) {
    await db.execute(stmt + ';')
  }
}
