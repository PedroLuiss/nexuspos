/**
 * Contrato compartido de Tipo de producto.
 * Permite distinguir productos simples, combos, servicios e insumos
 * para que el módulo de inventario se adapte a cualquier tipo de negocio.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export type ProductTypeKind = 'simple' | 'combo' | 'service' | 'raw_material'

export interface ProductType {
  id: string
  name: string
  kind: ProductTypeKind
  /** Si es true, el producto no tiene stock físico (ej. servicio). */
  trackStock: boolean
  active: boolean
  deleted?: boolean
  /** Cantidad de productos que referencian este tipo (solo lectura). */
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un tipo de producto (el id y timestamps los genera el backend). */
export type ProductTypeInput = Omit<ProductType, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>

export interface ProductTypeFilter {
  search?: string
  includeDeleted?: boolean
  onlyActive?: boolean
  includeInactive?: boolean
}
