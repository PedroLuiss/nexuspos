/**
 * Motor de salida de lotes por caducidad (FEFO) / antigüedad (FIFO).
 *
 * Vive en `src/shared/lib` porque lo consumen **main** y **renderer**:
 * el backend descuenta lotes al cobrar y el renderer puede mostrar el
 * desglose de lotes consumidos. Una sola implementación evita divergencias.
 */
import type { ProductBatch } from '../contracts/product-batch.contract'

/** Resultado de descontar una cantidad de los lotes de un producto. */
export interface BatchIssue {
  batchId: string
  batchNumber: string
  quantity: number
}

export interface BatchIssueResult {
  issues: BatchIssue[]
  /** Cantidad que no se pudo cubrir con los lotes disponibles. */
  shortfall: number
}

/** ¿Está vencido el lote a la fecha dada (o今天 por defecto)? */
export function isBatchExpired(batch: ProductBatch, now = new Date()): boolean {
  if (!batch.expirationDate) return false
  const exp = new Date(`${batch.expirationDate}T23:59:59`)
  return exp.getTime() < now.getTime()
}

/** Días hasta el vencimiento (negativo si ya venció). null si no tiene fecha. */
export function daysToExpiry(batch: ProductBatch, now = new Date()): number | null {
  if (!batch.expirationDate) return null
  const [year, month, day] = batch.expirationDate.split('-').map(Number)
  // Medianoche local de la fecha de vencimiento vs. medianoche local de hoy,
  // para que un vencimiento "mañana" devuelva exactamente 1 (sin depender de la hora).
  const exp = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000)
}

/** Ordena los lotes por estrategia: FEFO (vencen antes primero) o FIFO (entran antes primero). */
export function sortBatches(batches: ProductBatch[], strategy: 'FEFO' | 'FIFO'): ProductBatch[] {
  const copy = [...batches]
  if (strategy === 'FIFO') {
    return copy.sort((a, b) => a.enteredAt.localeCompare(b.enteredAt))
  }
  // FEFO: lotes con fecha de vencimiento primero (los que vencen antes), luego sin fecha por enteredAt
  return copy.sort((a, b) => {
    if (a.expirationDate && b.expirationDate) {
      return a.expirationDate.localeCompare(b.expirationDate)
    }
    if (a.expirationDate && !b.expirationDate) return -1
    if (!a.expirationDate && b.expirationDate) return 1
    return a.enteredAt.localeCompare(b.enteredAt)
  })
}

/**
 * Descuenta `quantity` de los lotes disponibles según la estrategia.
 * No muta los lotes de entrada; devuelve qué lotes se consumieron y cuánto.
 */
export function issueFromBatches(
  batches: ProductBatch[],
  quantity: number,
  strategy: 'FEFO' | 'FIFO' = 'FEFO'
): BatchIssueResult {
  let remaining = quantity
  const issues: BatchIssue[] = []
  const candidates = sortBatches(
    batches.filter((b) => !b.deleted && b.active && b.quantity > 0),
    strategy
  )

  for (const batch of candidates) {
    if (remaining <= 0) break
    const take = Math.min(batch.quantity, remaining)
    issues.push({ batchId: batch.id, batchNumber: batch.batchNumber, quantity: take })
    remaining -= take
  }

  return { issues, shortfall: Math.max(0, remaining) }
}
