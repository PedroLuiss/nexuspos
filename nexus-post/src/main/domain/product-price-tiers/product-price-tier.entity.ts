import type { ProductPriceTierInput } from '@shared/contracts'

const MAX_TIER_LABEL_LENGTH = 64

/** Normaliza y sanea los datos de entrada de un precio por mayoreo. */
export function normalizeProductPriceTierInput(input: ProductPriceTierInput): ProductPriceTierInput {
  return {
    productId: (input.productId ?? '').trim(),
    minQuantity: Math.max(0, Number(input.minQuantity) || 0),
    maxQuantity:
      input.maxQuantity === undefined || input.maxQuantity === null
        ? undefined
        : Math.max(0, Number(input.maxQuantity) || 0),
    price: Math.max(0, Number(input.price) || 0),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un precio por mayoreo. */
export function validateProductPriceTierInput(input: ProductPriceTierInput): string[] {
  const errors: string[] = []
  if (!input.productId?.trim()) errors.push('El producto es obligatorio')
  if (!Number.isFinite(Number(input.minQuantity)) || Number(input.minQuantity) < 0) {
    errors.push('La cantidad mínima debe ser un número válido mayor o igual a 0')
  }
  if (
    input.maxQuantity !== undefined &&
    input.maxQuantity !== null &&
    (Number(input.maxQuantity) < Number(input.minQuantity))
  ) {
    errors.push('La cantidad máxima debe ser mayor o igual a la cantidad mínima')
  }
  if (!Number.isFinite(Number(input.price)) || Number(input.price) <= 0) {
    errors.push('El precio debe ser un número válido mayor a 0')
  }
  return errors
}
