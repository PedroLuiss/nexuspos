import type { BarcodeFormat } from '@shared/contracts'

export const PRODUCT_BARCODE_FORMATS: readonly BarcodeFormat[] = [
  'EAN-13',
  'EAN-8',
  'UPC-A',
  'Code128',
  'Code39',
  'ITF-14',
  'OTRO'
]

const BARCODE_RE = /^[0-9A-Za-z-]+$/

function hasValidGs1CheckDigit(value: string): boolean {
  const digits = value.slice(0, -1).split('').map(Number)
  const firstWeight = digits.length % 2 === 0 ? 1 : 3
  const sum = digits.reduce(
    (total, digit, index) => total + digit * (index % 2 ? 4 - firstWeight : firstWeight),
    0
  )
  return (10 - (sum % 10)) % 10 === Number(value.at(-1))
}

function isValidFormatValue(value: string, format: BarcodeFormat): boolean {
  if (format === 'EAN-13') return /^\d{13}$/.test(value) && hasValidGs1CheckDigit(value)
  if (format === 'EAN-8') return /^\d{8}$/.test(value) && hasValidGs1CheckDigit(value)
  if (format === 'UPC-A') return /^\d{12}$/.test(value) && hasValidGs1CheckDigit(value)
  if (format === 'ITF-14') return /^\d{14}$/.test(value) && hasValidGs1CheckDigit(value)
  if (format === 'Code39') return /^[0-9A-Z.$/+% -]+$/.test(value)
  if (format === 'Code128') return /^[\x20-\x7E]+$/.test(value)
  return BARCODE_RE.test(value)
}

export function getProductBarcodeValidationError(
  value: string,
  format: BarcodeFormat
): string | null {
  if (!PRODUCT_BARCODE_FORMATS.includes(format)) {
    return 'Formato de código de barras no válido'
  }
  const normalizedValue = value.trim()
  if (!normalizedValue) return 'El código de barras es obligatorio'
  if (!isValidFormatValue(normalizedValue, format)) {
    return `El código no es válido para el formato ${format}`
  }
  return null
}
