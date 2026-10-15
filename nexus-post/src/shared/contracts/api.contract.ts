import type { Product, ProductInput, ProductFilter } from './product.contract'
import type { AdjustStockInput, AdjustStockResult, KardexMovement } from './inventory.contract'
import type { Category, CategoryInput, CategoryFilter } from './category.contract'

/**
 * Nombres canónicos de los canales IPC.
 * Formato: `<dominio>:<accion>`.
 */
export const IPC_CHANNELS = {
  products: {
    list: 'products:list',
    getById: 'products:getById',
    create: 'products:create',
    update: 'products:update',
    softDelete: 'products:softDelete',
    toggleStatus: 'products:toggleStatus'
  },
  inventory: {
    adjustStock: 'inventory:adjustStock',
    listMovements: 'inventory:listMovements'
  },
  categories: {
    list: 'categories:list',
    create: 'categories:create',
    update: 'categories:update',
    softDelete: 'categories:softDelete',
    toggleStatus: 'categories:toggleStatus'
  }
} as const

export interface ProductsApi {
  list(filter?: ProductFilter): Promise<Product[]>
  getById(id: string): Promise<Product | null>
  create(input: ProductInput): Promise<Product>
  update(product: Product): Promise<Product>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Product>
}

export interface InventoryApi {
  adjustStock(input: AdjustStockInput): Promise<AdjustStockResult>
  listMovements(productId?: string): Promise<KardexMovement[]>
}

export interface CategoriesApi {
  list(filter?: CategoryFilter): Promise<Category[]>
  create(input: CategoryInput): Promise<Category>
  update(category: Category): Promise<Category>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Category>
}

/** Superficie completa expuesta en `window.api` por el preload. */
export interface NexusApi {
  products: ProductsApi
  inventory: InventoryApi
  categories: CategoriesApi
}
