import type {
  Product,
  ProductInput,
  ProductFilter,
  ProductPageQuery,
  ProductPageResult,
  ProductCatalogStatsDelta,
  AdjustStockInput,
  AdjustStockResult,
  KardexMovementQuery,
  KardexMovementPage
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
  listPage: (query: ProductPageQuery): Promise<ProductPageResult> =>
    bridge().products.listPage(query),
  getById: (id: string): Promise<Product | null> => bridge().products.getById(id),
  create: (input: ProductInput): Promise<Product> => bridge().products.create(input),
  update: (product: Product): Promise<Product> => bridge().products.update(product),
  softDelete: (id: string): Promise<ProductCatalogStatsDelta> => bridge().products.softDelete(id),
  toggleStatus: (id: string): Promise<Product> => bridge().products.toggleStatus(id)
}

export const inventoryApi = {
  adjustStock: (input: AdjustStockInput): Promise<AdjustStockResult> =>
    bridge().inventory.adjustStock(input),
  listMovements: (query: KardexMovementQuery): Promise<KardexMovementPage> =>
    bridge().inventory.listMovements(query)
}

/** Normaliza el mensaje de error devuelto por `ipcRenderer.invoke`. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}
