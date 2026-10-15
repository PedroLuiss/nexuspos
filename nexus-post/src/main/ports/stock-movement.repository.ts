import type { KardexMovement } from '@shared/contracts'

/** Puerto de persistencia del Kardex (movimientos de stock inmutables). */
export interface StockMovementRepository {
  insert(movement: KardexMovement): void
  findAll(productId?: string): KardexMovement[]
}
