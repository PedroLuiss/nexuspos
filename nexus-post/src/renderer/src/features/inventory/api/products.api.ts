import type {
  Product,
  ProductInput,
  ProductFilter,
  AdjustStockInput,
  AdjustStockResult,
  KardexMovement
} from '@shared/contracts'

/** Acceso tipado al puente IPC expuesto por el preload (`window.api`). */
function bridge(): Window['api'] {
  if (typeof window === 'undefined' || !window.api) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api
}

export const productsApi = {
  list: (filter?: ProductFilter): Promise<Product[]> => bridge().products.list(filter),
  create: (input: ProductInput): Promise<Product> => bridge().products.create(input),
  update: (product: Product): Promise<Product> => bridge().products.update(product),
  softDelete: (id: string): Promise<void> => bridge().products.softDelete(id),
  toggleStatus: (id: string): Promise<Product> => bridge().products.toggleStatus(id)
}

export const inventoryApi = {
  adjustStock: (input: AdjustStockInput): Promise<AdjustStockResult> =>
    bridge().inventory.adjustStock(input),
  listMovements: (productId?: string): Promise<KardexMovement[]> =>
    bridge().inventory.listMovements(productId)
}

/** Normaliza el mensaje de error devuelto por `ipcRenderer.invoke`. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}
