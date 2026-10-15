import type { Product, ProductInput } from '@shared/contracts'
import { roundMoney } from '../shared/money'

const DEFAULT_UNIT = 'Pieza (pza)'

/** Normaliza y sanea los datos de entrada de un producto. */
export function normalizeProductInput(input: ProductInput): ProductInput {
  return {
    code: input.code.trim(),
    name: input.name.trim(),
    category: (input.category ?? '').trim(),
    costPrice: roundMoney(Math.max(0, Number(input.costPrice) || 0)),
    salePrice: roundMoney(Math.max(0, Number(input.salePrice) || 0)),
    stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
    minStock: Math.max(0, Math.floor(Number(input.minStock) || 0)),
    maxStock:
      input.maxStock === undefined || input.maxStock === null
        ? undefined
        : Math.max(0, Math.floor(Number(input.maxStock) || 0)),
    unit: input.unit?.trim() || DEFAULT_UNIT,
    hasTax: Boolean(input.hasTax),
    active: input.active ?? true,
    deleted: input.deleted ?? false,
    description: (input.description ?? '').trim()
  }
}

/** Reglas de validación de negocio. Devuelve la lista de errores. */
export function validateProductInput(input: ProductInput): string[] {
  const errors: string[] = []
  if (!input.code?.trim()) errors.push('El código de barras / SKU es obligatorio')
  if (!input.name?.trim()) errors.push('El nombre del producto es obligatorio')
  if (!(Number(input.salePrice) > 0)) errors.push('El precio de venta debe ser mayor a 0')
  if (Number(input.costPrice) < 0) errors.push('El precio de costo no puede ser negativo')
  if (Number(input.stock) < 0) errors.push('El stock no puede ser negativo')
  if (Number(input.minStock) < 0) errors.push('El stock mínimo no puede ser negativo')
  return errors
}

/** Aplica el borrado lógico conservando la integridad referencial del Kardex. */
export function softDeleteProduct(product: Product): Product {
  return { ...product, active: false, deleted: true }
}
