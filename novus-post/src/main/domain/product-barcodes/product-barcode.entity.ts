import type { ProductBarcodeInput } from '@shared/contracts'
import {
  getProductBarcodeValidationError,
  PRODUCT_BARCODE_FORMATS
} from '@shared/lib/product-barcode'

const MAX_BARCODE_LENGTH = 64
const MAX_LABEL_LENGTH = 64
/** Normaliza y sanea los datos de entrada de un código de barras. */
export function normalizeProductBarcodeInput(input: ProductBarcodeInput): ProductBarcodeInput {
  const format = input.format ?? 'EAN-13'
  return {
    productId: (input.productId ?? '').trim(),
    barcode: (input.barcode ?? '').trim().slice(0, MAX_BARCODE_LENGTH),
    format: PRODUCT_BARCODE_FORMATS.includes(format) ? format : 'EAN-13',
    label: (input.label ?? '').trim().slice(0, MAX_LABEL_LENGTH),
    isPrimary: Boolean(input.isPrimary),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un código de barras. */
export function validateProductBarcodeInput(input: ProductBarcodeInput): string[] {
  const errors: string[] = []
  if (!input.productId?.trim()) errors.push('El producto es obligatorio')
  const barcode = input.barcode?.trim() ?? ''
  if (!barcode) errors.push('El código de barras es obligatorio')
  const format = input.format ?? 'EAN-13'
  if (!PRODUCT_BARCODE_FORMATS.includes(format)) {
    errors.push('Formato de código de barras no válido')
  } else if (barcode) {
    const valueError = getProductBarcodeValidationError(barcode, format)
    if (valueError) errors.push(valueError)
  }
  return errors
}
