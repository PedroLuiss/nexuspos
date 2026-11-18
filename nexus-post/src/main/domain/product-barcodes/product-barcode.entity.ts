import type { ProductBarcodeInput } from '@shared/contracts'

const MAX_BARCODE_LENGTH = 64
const MAX_LABEL_LENGTH = 64
const VALID_FORMATS = [
  'EAN-13',
  'EAN-8',
  'UPC-A',
  'Code128',
  'Code39',
  'ITF-14',
  'OTRO'
]

const BARCODE_RE = /^[0-9A-Za-z\-]+$/

/** Normaliza y sanea los datos de entrada de un código de barras. */
export function normalizeProductBarcodeInput(input: ProductBarcodeInput): ProductBarcodeInput {
  return {
    productId: (input.productId ?? '').trim(),
    barcode: (input.barcode ?? '').trim().slice(0, MAX_BARCODE_LENGTH),
    format: VALID_FORMATS.includes(input.format ?? 'EAN-13') ? (input.format as any) : 'EAN-13',
    label: (input.label ?? '').trim().slice(0, MAX_LABEL_LENGTH),
    isPrimary: Boolean(input.isPrimary),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un código de barras. */
export function validateProductBarcodeInput(input: ProductBarcodeInput): string[] {
  const errors: string[] = []
  if (!input.productId?.trim()) errors.push('El producto es obligatorio')
  if (!input.barcode?.trim()) errors.push('El código de barras es obligatorio')
  if (!BARCODE_RE.test(input.barcode ?? '')) {
    errors.push('El código de barras solo puede contener letras, números y guiones')
  }
  if (!VALID_FORMATS.includes(input.format ?? 'EAN-13')) {
    errors.push('Formato de código de barras no válido')
  }
  return errors
}
