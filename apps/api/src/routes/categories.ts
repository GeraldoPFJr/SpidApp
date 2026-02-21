import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
})

const updateCategorySchema = z.object({
  name: z.string().min(1).max(200),
})

const createSubcategorySchema = z.object({
  name: z.string().min(1).max(200),
})

const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(200),
})

export async function categoriesRoutes(app: FastifyInstance) {
  // GET /categories - list all with subcategories
  app.get('/', async () => {
    return prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    })
  })

  // GET /categories/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const category = await prisma.category.findUnique({
      where: { id: request.params.id },
      include: { subcategories: true },
    })
    if (!category) return reply.status(404).send({ error: 'Category not found' })
    return category
  })

  // POST /categories
  app.post('/', async (request, reply) => {
    const parsed = createCategorySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    return prisma.category.create({ data: parsed.data })
  })

  // PUT /categories/:id
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = updateCategorySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.category.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Category not found' })

    return prisma.category.update({
      where: { id: request.params.id },
      data: parsed.data,
    })
  })

  // DELETE /categories/:id - hard delete
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await prisma.category.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Category not found' })

    await prisma.category.delete({ where: { id: request.params.id } })
    return { success: true }
  })

  // GET /categories/:id/subcategories
  app.get<{ Params: { id: string } }>('/:id/subcategories', async (request, reply) => {
    const category = await prisma.category.findUnique({ where: { id: request.params.id } })
    if (!category) return reply.status(404).send({ error: 'Category not found' })

    return prisma.subcategory.findMany({
      where: { categoryId: request.params.id },
      orderBy: { name: 'asc' },
    })
  })

  // POST /categories/:id/subcategories
  app.post<{ Params: { id: string } }>('/:id/subcategories', async (request, reply) => {
    const parsed = createSubcategorySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const category = await prisma.category.findUnique({ where: { id: request.params.id } })
    if (!category) return reply.status(404).send({ error: 'Category not found' })

    return prisma.subcategory.create({
      data: { ...parsed.data, categoryId: request.params.id },
    })
  })

  // PUT /subcategories/:id
  app.put<{ Params: { id: string } }>('/subcategories/:id', async (request, reply) => {
    const parsed = updateSubcategorySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.subcategory.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Subcategory not found' })

    return prisma.subcategory.update({
      where: { id: request.params.id },
      data: parsed.data,
    })
  })

  // DELETE /subcategories/:id
  app.delete<{ Params: { id: string } }>('/subcategories/:id', async (request, reply) => {
    const existing = await prisma.subcategory.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Subcategory not found' })

    await prisma.subcategory.delete({ where: { id: request.params.id } })
    return { success: true }
  })
}
