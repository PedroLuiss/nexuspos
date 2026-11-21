/**
 * Contrato compartido de Componentes de Combo (bundle).
 *
 * Un producto de tipo "combo" (`product_types.kind = 'combo'`) se compone de
 * otros productos. Al vender el combo se cobra su precio de venta y el stock
 * se descuenta de cada componente (desglose a Kardex), no del combo directamente.
 *
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface ComboItem {
  id: string
  /** Producto padre de tipo combo. */
  comboId: string
  /** Producto componente que se consume al vender el combo. */
  componentId: string
  /** Nombre del componente (desnormalizado para tickets/Kardex). */
  componentName?: string
  /** Unidades del componente que contiene una unidad del combo. */
  quantity: number
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un componente de combo (id y timestamps los genera el backend). */
export type ComboItemInput = Omit<
  ComboItem,
  'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'componentName'
>

export interface ComboItemFilter {
  comboId?: string
  componentId?: string
  includeDeleted?: boolean
  onlyActive?: boolean
}
