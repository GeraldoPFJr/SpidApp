-- ============================================================
-- Migration: add_multi_tenant
-- Adds Tenant model and tenant_id to all existing tables
-- ============================================================

-- 1. Create tenants table
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- 2. Insert default tenant
INSERT INTO "tenants" ("id", "email", "password_hash", "company_name", "created_at", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'geraldofurtadojr@gmail.com', 'PLACEHOLDER_HASH', 'Minha Empresa', NOW(), NOW());

-- ============================================================
-- 3. Add tenant_id to each table (nullable first, then backfill, then NOT NULL)
-- ============================================================

-- --- categories ---
ALTER TABLE "categories" ADD COLUMN "tenant_id" TEXT;
UPDATE "categories" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "categories" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- --- subcategories ---
ALTER TABLE "subcategories" ADD COLUMN "tenant_id" TEXT;
UPDATE "subcategories" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "subcategories" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "subcategories_tenant_id_idx" ON "subcategories"("tenant_id");

-- --- products ---
ALTER TABLE "products" ADD COLUMN "tenant_id" TEXT;
UPDATE "products" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "products" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- --- product_units ---
ALTER TABLE "product_units" ADD COLUMN "tenant_id" TEXT;
UPDATE "product_units" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "product_units" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "product_units_tenant_id_idx" ON "product_units"("tenant_id");

-- --- price_tiers ---
ALTER TABLE "price_tiers" ADD COLUMN "tenant_id" TEXT;
UPDATE "price_tiers" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "price_tiers" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "price_tiers_tenant_id_idx" ON "price_tiers"("tenant_id");

-- --- product_prices ---
ALTER TABLE "product_prices" ADD COLUMN "tenant_id" TEXT;
UPDATE "product_prices" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "product_prices" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "product_prices_tenant_id_idx" ON "product_prices"("tenant_id");

-- --- customers ---
ALTER TABLE "customers" ADD COLUMN "tenant_id" TEXT;
UPDATE "customers" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "customers" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- --- suppliers ---
ALTER TABLE "suppliers" ADD COLUMN "tenant_id" TEXT;
UPDATE "suppliers" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "suppliers" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- --- purchases ---
ALTER TABLE "purchases" ADD COLUMN "tenant_id" TEXT;
UPDATE "purchases" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "purchases" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "purchases_tenant_id_idx" ON "purchases"("tenant_id");

-- --- purchase_items ---
ALTER TABLE "purchase_items" ADD COLUMN "tenant_id" TEXT;
UPDATE "purchase_items" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "purchase_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "purchase_items_tenant_id_idx" ON "purchase_items"("tenant_id");

-- --- purchase_costs ---
ALTER TABLE "purchase_costs" ADD COLUMN "tenant_id" TEXT;
UPDATE "purchase_costs" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "purchase_costs" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "purchase_costs" ADD CONSTRAINT "purchase_costs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "purchase_costs_tenant_id_idx" ON "purchase_costs"("tenant_id");

-- --- inventory_movements ---
ALTER TABLE "inventory_movements" ADD COLUMN "tenant_id" TEXT;
UPDATE "inventory_movements" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "inventory_movements" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "inventory_movements_tenant_id_idx" ON "inventory_movements"("tenant_id");

-- --- cost_lots ---
ALTER TABLE "cost_lots" ADD COLUMN "tenant_id" TEXT;
UPDATE "cost_lots" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "cost_lots" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "cost_lots" ADD CONSTRAINT "cost_lots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "cost_lots_tenant_id_idx" ON "cost_lots"("tenant_id");

-- --- sales ---
ALTER TABLE "sales" ADD COLUMN "tenant_id" TEXT;
UPDATE "sales" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "sales" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "sales_tenant_id_idx" ON "sales"("tenant_id");

-- --- sale_items ---
ALTER TABLE "sale_items" ADD COLUMN "tenant_id" TEXT;
UPDATE "sale_items" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "sale_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "sale_items_tenant_id_idx" ON "sale_items"("tenant_id");

-- --- receivables ---
ALTER TABLE "receivables" ADD COLUMN "tenant_id" TEXT;
UPDATE "receivables" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "receivables" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "receivables_tenant_id_idx" ON "receivables"("tenant_id");

-- --- receivable_settlements ---
ALTER TABLE "receivable_settlements" ADD COLUMN "tenant_id" TEXT;
UPDATE "receivable_settlements" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "receivable_settlements" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "receivable_settlements" ADD CONSTRAINT "receivable_settlements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "receivable_settlements_tenant_id_idx" ON "receivable_settlements"("tenant_id");

-- --- payments ---
ALTER TABLE "payments" ADD COLUMN "tenant_id" TEXT;
UPDATE "payments" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- --- accounts ---
ALTER TABLE "accounts" ADD COLUMN "tenant_id" TEXT;
UPDATE "accounts" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "accounts" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "accounts_tenant_id_idx" ON "accounts"("tenant_id");

-- --- finance_categories ---
ALTER TABLE "finance_categories" ADD COLUMN "tenant_id" TEXT;
UPDATE "finance_categories" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "finance_categories" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "finance_categories_tenant_id_idx" ON "finance_categories"("tenant_id");

-- --- finance_entries ---
ALTER TABLE "finance_entries" ADD COLUMN "tenant_id" TEXT;
UPDATE "finance_entries" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "finance_entries" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "finance_entries_tenant_id_idx" ON "finance_entries"("tenant_id");

-- --- monthly_closures ---
ALTER TABLE "monthly_closures" ADD COLUMN "tenant_id" TEXT;
UPDATE "monthly_closures" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "monthly_closures" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "monthly_closures" ADD CONSTRAINT "monthly_closures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "monthly_closures_tenant_id_idx" ON "monthly_closures"("tenant_id");

-- --- outbox_operations ---
ALTER TABLE "outbox_operations" ADD COLUMN "tenant_id" TEXT;
UPDATE "outbox_operations" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "outbox_operations" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "outbox_operations" ADD CONSTRAINT "outbox_operations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "outbox_operations_tenant_id_idx" ON "outbox_operations"("tenant_id");

-- --- sync_cursors ---
ALTER TABLE "sync_cursors" ADD COLUMN "tenant_id" TEXT;
UPDATE "sync_cursors" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "sync_cursors" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "sync_cursors" ADD CONSTRAINT "sync_cursors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "sync_cursors_tenant_id_idx" ON "sync_cursors"("tenant_id");

-- ============================================================
-- 4. Handle app_settings: change id from 'singleton' to uuid, add tenant_id as unique
-- ============================================================

-- Update existing singleton row: new uuid id + tenant_id
UPDATE "app_settings"
SET "id" = '00000000-0000-0000-0000-000000000002'
WHERE "id" = 'singleton';

-- Remove the old default on id column and set uuid default
ALTER TABLE "app_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Add tenant_id column
ALTER TABLE "app_settings" ADD COLUMN "tenant_id" TEXT;
UPDATE "app_settings" SET "tenant_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "app_settings" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Add unique constraint and foreign key
CREATE UNIQUE INDEX "app_settings_tenant_id_key" ON "app_settings"("tenant_id");
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
