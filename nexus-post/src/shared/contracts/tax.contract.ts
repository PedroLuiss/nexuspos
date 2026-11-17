/**
 * Contrato compartido del catálogo de impuestos (IVA / IGV / ITBMS…).
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni React.
 *
 * Modelo: un negocio puede facturar varias alícuotas al mismo tiempo
 * (general, reducida, adicional) y productos exentos. Cada producto apunta
 * a una tasa del catálogo mediante `taxId`.
 */

export interface TaxRate {
  id: string
  /** Nombre visible: "IVA General", "IVA Reducido", "Exento". */
  name: string
  /** Tasa expresada en porcentaje (16 = 16%). 0 = exento. */
  rate: number
  /** Código corto opcional para reportes fiscales (G, R, E). */
  code?: string
  /** Tasa que se asigna por defecto a los productos nuevos. */
  isDefault: boolean
  active: boolean
  deleted?: boolean
  /** Cantidad de productos que usan esta tasa (solo lectura, lo calcula el repositorio). */
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

/** Datos editables del catálogo (id y timestamps los genera el backend). */
export type TaxInput = Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>

export interface TaxesApi {
  /** `includeInactive` permite listar tasas retiradas (Ajustes y filtros históricos). */
  list(includeInactive?: boolean): Promise<TaxRate[]>
  create(input: TaxInput): Promise<TaxRate>
  update(tax: TaxRate): Promise<TaxRate>
  /** Borrado lógico; se bloquea si la tasa está en uso o es la predeterminada. */
  remove(id: string): Promise<void>
  setDefault(id: string): Promise<TaxRate>
}
