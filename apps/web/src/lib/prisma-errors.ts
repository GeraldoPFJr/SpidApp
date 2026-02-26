/**
 * Extrai mensagem amigável de erros do Prisma
 * https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export function getPrismaErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  // Verificar se é erro do Prisma
  if (!('code' in error)) return null

  const code = (error as { code: string }).code
  const meta = (error as { meta?: Record<string, unknown> }).meta

  switch (code) {
    case 'P2002': {
      // Unique constraint violation
      const target = meta?.target as string[] | undefined
      const field = target?.[0] || 'campo'
      const fieldMap: Record<string, string> = {
        code: 'código',
        email: 'e-mail',
        name: 'nome',
        cpfCnpj: 'CPF/CNPJ',
        phone: 'telefone',
      }
      const friendlyField = fieldMap[field] || field
      return `Já existe um registro com este ${friendlyField}`
    }

    case 'P2003':
      // Foreign key constraint violation
      return 'Registro vinculado não encontrado'

    case 'P2025':
      // Record not found
      return 'Registro não encontrado'

    case 'P2014':
      // Relation violation
      return 'Este registro está vinculado a outros dados e não pode ser excluído'

    case 'P2000':
      // Value too long
      return 'Valor muito longo para o campo'

    case 'P2001':
      // Record does not exist
      return 'Registro não existe'

    case 'P2015':
      // Related record not found
      return 'Registro relacionado não encontrado'

    default:
      return null
  }
}

/**
 * Retorna mensagem de erro amigável, priorizando erros do Prisma
 */
export function getErrorMessage(error: unknown, fallback = 'Erro ao processar solicitação'): string {
  // Tentar extrair mensagem do Prisma primeiro
  const prismaMessage = getPrismaErrorMessage(error)
  if (prismaMessage) return prismaMessage

  // Error nativo
  if (error instanceof Error) {
    return error.message
  }

  // String
  if (typeof error === 'string') {
    return error
  }

  // Objeto com message
  if (typeof error === 'object' && error && 'message' in error) {
    const msg = (error as { message: unknown }).message
    if (typeof msg === 'string') return msg
  }

  return fallback
}
