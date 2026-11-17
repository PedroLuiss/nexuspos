/**
 * Contrato compartido de Proveedor de producto.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface Supplier {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un proveedor (el id y timestamps los genera el backend). */
export type SupplierInput = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>

export interface SupplierFilter {
  search?: string
  includeDeleted?: boolean
  onlyActive?: boolean
  includeInactive?: boolean
}
