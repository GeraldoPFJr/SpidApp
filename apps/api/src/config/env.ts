import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SYNC_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3001),
})

function loadEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()
