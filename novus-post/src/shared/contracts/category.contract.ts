/**
 * Contrato compartido de Categoría de producto.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface Category {
  id: string
  name: string
  description?: string
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear una categoría (el id y timestamps los genera el backend). */
export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>

export interface CategoryFilter {
  search?: string
  includeDeleted?: boolean
  onlyActive?: boolean
}
