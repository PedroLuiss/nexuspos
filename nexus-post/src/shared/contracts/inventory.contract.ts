import type { Product } from './product.contract'
import type { CurrencyCode } from './settings.contract'

/**
 * Contrato compartido de movimientos de inventario (Kardex).
 * Registro inmutable de cada entrada/salida de stock.
 */
export type KardexMovementType = 'ENTRADA' | 'SALIDA'

export type KardexReason =
  | 'VENTA'
  | 'COMBO'
  | 'ENTRADA_MASIVA'
  | 'SALIDA_AJUSTE'
  | 'MERMA'
  | 'DEVOLUCION'
  | 'INVENTARIO_INICIAL'

export type KardexMovementSource = 'INVENTORY' | 'POS' | 'CASH' | 'LEGACY'
export type KardexValuationBasis = 'SALE_SNAPSHOT' | 'PRODUCT_COST'
export type KardexPeriod = 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'
export type KardexExportFormat = 'XLSX' | 'PDF'

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
  source: KardexMovementSource
  unit?: string
  reference?: string
  batchNumber?: string
  unitCost?: number
  valuationBasis?: KardexValuationBasis
  currency: CurrencyCode
}

export interface KardexMovementQuery {
  period: KardexPeriod
  from?: string
  to?: string
  search: string
  type: KardexMovementType | 'ALL'
  reason: KardexReason | 'ALL'
  page: number
  pageSize: number
}

export interface KardexQuantityByUnit {
  unit: string
  quantity: number
}

export interface KardexMovementSummary {
  total: number
  distinctProducts: number
  entryMovements: number
  exitMovements: number
  entriesByUnit: KardexQuantityByUnit[]
  exitsByUnit: KardexQuantityByUnit[]
}

export interface KardexMovementPage {
  items: KardexMovement[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  summary: KardexMovementSummary
}

/** Datos de entrada para registrar un ajuste manual de stock. */
export interface AdjustStockInput {
  productId: string
  type: KardexMovementType
  quantity: number
  reason: KardexReason
  notes?: string
}

export interface AdjustStockResult {
  product: Product
  movement: KardexMovement
}
