/**
 * Contrato compartido de Marca de producto.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface Brand {
  id: string
  name: string
  description?: string
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear una marca (el id y timestamps los genera el backend). */
export type BrandInput = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>

export interface BrandFilter {
  search?: string
  includeDeleted?: boolean
  onlyActive?: boolean
  includeInactive?: boolean
}
