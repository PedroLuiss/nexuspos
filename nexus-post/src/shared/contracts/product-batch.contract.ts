/**
 * Contrato compartido de Lotes y caducidad de productos.
 *
 * Un lote representa una entrada de mercancía con cantidad, número de lote y
 * fecha de vencimiento opcional. El stock de un producto con control de lotes
 * se deriva de la suma de sus lotes activos. Las salidas se descuentan FEFO
 * (First Expired, First Out): primero el lote que vence antes; los lotes sin
 * fecha de vencimiento se tratan como los más "lejanos" y salen al final.
 *
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */

/** Algoritmo de salida de lotes. */
export type BatchIssueStrategy = 'FEFO' | 'FIFO'

export interface ProductBatch {
  id: string
  productId: string
  /** Número/nombre del lote (ej. "LOTE-2026-01"). */
  batchNumber: string
  /** Cantidad disponible en el lote. */
  quantity: number
  /** Fecha de vencimiento (ISO yyyy-mm-dd). Opcional. */
  expirationDate?: string
  /** Fecha en que entró el lote (ISO). */
  enteredAt: string
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un lote (id y timestamps los genera el backend). */
export type ProductBatchInput = Omit<
  ProductBatch,
  'id' | 'enteredAt' | 'createdAt' | 'updatedAt' | 'deleted'
>

export interface ProductBatchFilter {
  productId?: string
  includeDeleted?: boolean
  onlyActive?: boolean
  /** Solo lotes con stock > 0. */
  onlyWithStock?: boolean
  /** Solo lotes ya vencidos a la fecha actual. */
  onlyExpired?: boolean
}

/** Lote con información de vencimiento calculada (solo lectura, para UI). */
export interface ProductBatchView extends ProductBatch {
  isExpired: boolean
  daysToExpiry: number | null
}
