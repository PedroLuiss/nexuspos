import type { Product, ProductPageQuery, ProductPageResult } from '@shared/contracts'

function bridge(): Window['api'] {
  if (typeof window === 'undefined' || !window.api) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api
}

export const posProductsApi = {
  listPage: (query: ProductPageQuery): Promise<ProductPageResult> =>
    bridge().products.listPage(query),
  getById: (id: string): Promise<Product | null> => bridge().products.getById(id)
}

export function posProductsErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}
