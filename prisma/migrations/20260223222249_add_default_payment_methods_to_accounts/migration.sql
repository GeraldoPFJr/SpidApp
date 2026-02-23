-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "default_payment_methods" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "app_settings" ALTER COLUMN "id" DROP DEFAULT;
