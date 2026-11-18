import type { KardexMovement, KardexMovementPage, KardexMovementQuery } from '@shared/contracts'

/** Puerto de persistencia del Kardex (movimientos de stock inmutables). */
export interface StockMovementRepository {
  insert(movement: KardexMovement): void
  findPage(query: KardexMovementQuery): KardexMovementPage
  findSaleUnitCost(reference: string, productId: string): number | null
}
