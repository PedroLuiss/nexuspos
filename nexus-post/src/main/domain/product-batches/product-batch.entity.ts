import type { ProductBatchInput } from '@shared/contracts'

/** Normaliza y sanea los datos de entrada de un lote. */
export function normalizeProductBatchInput(input: ProductBatchInput): ProductBatchInput {
  return {
    productId: (input.productId ?? '').trim(),
    batchNumber: (input.batchNumber ?? '').trim().slice(0, 64),
    quantity: Math.max(0, Number(input.quantity) || 0),
    expirationDate: input.expirationDate?.trim() || undefined,
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un lote. */
export function validateProductBatchInput(input: ProductBatchInput): string[] {
  const errors: string[] = []
  if (!input.productId?.trim()) errors.push('El producto es obligatorio')
  if (!input.batchNumber?.trim()) errors.push('El número de lote es obligatorio')
  if (!Number.isFinite(Number(input.quantity)) || Number(input.quantity) < 0) {
    errors.push('La cantidad debe ser un número válido mayor o igual a 0')
  }
  if (input.expirationDate?.trim() && Number.isNaN(Date.parse(input.expirationDate.trim()))) {
    errors.push('La fecha de vencimiento no es válida')
  }
  return errors
}
