import type { Product, ProductInput } from '@shared/contracts'
import { isValidProductQuantity } from '@shared/lib/product-quantity'
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
    stock: Math.max(0, Number(input.stock) || 0),
    minStock: Math.max(0, Number(input.minStock) || 0),
    maxStock:
      input.maxStock === undefined || input.maxStock === null
        ? undefined
        : Math.max(0, Number(input.maxStock) || 0),
    unit: input.unit?.trim() || DEFAULT_UNIT,
    taxId: input.taxId?.trim() || undefined,
    hasTax: Boolean(input.hasTax),
    active: input.active ?? true,
    deleted: input.deleted ?? false,
    parentId: input.parentId?.trim() || undefined,
    attributes: (input.attributes ?? '').trim(),
    variantAttrs: (input.variantAttrs ?? '').trim(),
    description: (input.description ?? '').trim(),
    imageUrl: input.imageUrl?.trim() || undefined
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
  if (!isValidProductQuantity(Number(input.stock), input.unit, true)) {
    errors.push(
      'El stock debe ser entero para productos por unidad o tener hasta 3 decimales para productos medibles'
    )
  }
  if (!isValidProductQuantity(Number(input.minStock), input.unit, true)) {
    errors.push(
      'El stock mínimo no coincide con la precisión permitida para la unidad del producto'
    )
  }
  if (
    input.maxStock !== undefined &&
    !isValidProductQuantity(Number(input.maxStock), input.unit, true)
  ) {
    errors.push(
      'El stock máximo no coincide con la precisión permitida para la unidad del producto'
    )
  }
  return errors
}

/** Aplica el borrado lógico conservando la integridad referencial del Kardex. */
export function softDeleteProduct(product: Product): Product {
  return { ...product, active: false, deleted: true }
}
