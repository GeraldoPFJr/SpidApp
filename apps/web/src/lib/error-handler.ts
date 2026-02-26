/**
 * Extrai mensagem de erro legível de qualquer tipo de erro
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Erro desconhecido'

  // Error nativo do JavaScript
  if (error instanceof Error) {
    return error.message
  }

  // String
  if (typeof error === 'string') {
    return error
  }

  // Objeto com propriedade message
  if (typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message
    if (typeof msg === 'string') return msg
  }

  // Prisma unique constraint violation
  if (typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code
    if (code === 'P2002') {
      // Unique constraint violation
      const meta = (error as { meta?: { target?: string[] } }).meta
      const field = meta?.target?.[0] || 'campo'
      return `Já existe um registro com este ${field}`
    }
    if (code === 'P2003') {
      return 'Registro vinculado não encontrado'
    }
    if (code === 'P2025') {
      return 'Registro não encontrado'
    }
  }

  // Fallback: stringify
  try {
    return JSON.stringify(error)
  } catch {
    return 'Erro desconhecido'
  }
}
