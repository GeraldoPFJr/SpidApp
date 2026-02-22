import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

const SINGLETON_ID = 'singleton'

const companySchema = z.object({
  tradeName: z.string().default(''),
  legalName: z.string().default(''),
  cnpj: z.string().default(''),
  ie: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  cep: z.string().default(''),
  phone1: z.string().default(''),
  phone2: z.string().default(''),
  sellerName: z.string().default(''),
}).default({})

const settingsSchema = z.object({
  company: companySchema,
  costMethod: z.enum(['FIFO', 'AVERAGE']).default('FIFO'),
  defaultPrintFormat: z.enum(['60mm', '80mm', 'A5', 'PDF']).default('80mm'),
  defaultPriceTierId: z.string().default(''),
})

type SettingsData = z.infer<typeof settingsSchema>

const defaultSettings: SettingsData = {
  company: {
    tradeName: '', legalName: '', cnpj: '', ie: '',
    address: '', city: '', state: '', cep: '',
    phone1: '', phone2: '', sellerName: '',
  },
  costMethod: 'FIFO',
  defaultPrintFormat: '80mm',
  defaultPriceTierId: '',
}

export async function GET() {
  try {
    const row = await prisma.appSettings.findUnique({ where: { id: SINGLETON_ID } })
    const data = row ? (row.data as SettingsData) : defaultSettings

    return NextResponse.json({
      ...defaultSettings,
      ...data,
      syncEnabled: true,
      instanceId: '',
    })
  } catch (error) {
    console.error('Error in GET /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await parseBody(request, settingsSchema)
    if ('error' in result) return result.error

    const row = await prisma.appSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, data: result.data },
      update: { data: result.data },
    })

    return NextResponse.json(row.data)
  } catch (error) {
    console.error('Error in PUT /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
