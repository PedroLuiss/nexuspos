/**
 * Contrato compartido de Producto.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface Product {
  id: string
  code: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  maxStock?: number
  unit: string
  hasTax: boolean
  active: boolean
  deleted?: boolean
  description?: string
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un producto (el id y timestamps los genera el backend). */
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

export interface ProductFilter {
  search?: string
  category?: string
  includeDeleted?: boolean
  onlyActive?: boolean
}
