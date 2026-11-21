/**
 * Contrato compartido de Tipo de producto.
 * Permite distinguir productos simples, combos, servicios e insumos
 * para que el módulo de inventario se adapte a cualquier tipo de negocio.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export type ProductTypeKind = 'simple' | 'combo' | 'service' | 'raw_material'

export interface CoreProductTypeDefinition {
  id: string
  name: string
  kind: ProductTypeKind
  trackStock: boolean
}

export const CORE_PRODUCT_TYPES: readonly CoreProductTypeDefinition[] = [
  { id: 'type-simple', name: 'Producto Simple', kind: 'simple', trackStock: true },
  { id: 'type-combo', name: 'Combo / Kit', kind: 'combo', trackStock: true },
  { id: 'type-service', name: 'Servicio', kind: 'service', trackStock: false },
  {
    id: 'type-raw-material',
    name: 'Insumo / Materia Prima',
    kind: 'raw_material',
    trackStock: true
  }
]

export function getCoreProductType(id: string): CoreProductTypeDefinition | undefined {
  return CORE_PRODUCT_TYPES.find((type) => type.id === id)
}

export function isCoreProductTypeId(id: string): boolean {
  return getCoreProductType(id) !== undefined
}

export interface ProductType {
  id: string
  name: string
  kind: ProductTypeKind
  /** Si es false, el producto no maneja existencias físicas (ej. servicio). */
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
