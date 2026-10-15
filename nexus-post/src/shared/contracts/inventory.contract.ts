import type { Product } from './product.contract'

/**
 * Contrato compartido de movimientos de inventario (Kardex).
 * Registro inmutable de cada entrada/salida de stock.
 */
export type KardexMovementType = 'ENTRADA' | 'SALIDA'

export type KardexReason =
  | 'VENTA'
  | 'ENTRADA_MASIVA'
  | 'SALIDA_AJUSTE'
  | 'MERMA'
  | 'DEVOLUCION'
  | 'INVENTARIO_INICIAL'

export interface KardexMovement {
  id: string
  timestamp: string
  productId: string
  productName: string
  productCode: string
  type: KardexMovementType
  reason: KardexReason
  previousStock: number
  quantity: number
  newStock: number
  finalStock?: number
  responsibleUser: string
  notes?: string
}

/** Datos de entrada para registrar un ajuste manual de stock. */
export interface AdjustStockInput {
  productId: string
  quantity: number
  reason: KardexReason
  notes?: string
  responsibleUser: string
}

export interface AdjustStockResult {
  product: Product
  movement: KardexMovement
}

/** Motivos que representan una entrada (+) en el Kardex. */
export const INBOUND_REASONS: KardexReason[] = [
  'ENTRADA_MASIVA',
  'INVENTARIO_INICIAL',
  'DEVOLUCION'
]

export function isInboundReason(reason: KardexReason): boolean {
  return INBOUND_REASONS.includes(reason)
}
