const FRACTIONAL_UNIT_PATTERN =
  /\b(kg|kilogram(?:o|os)?|lt|litro(?:s)?|l|g|gramo(?:s)?|lb|libra(?:s)?|oz|onza(?:s)?)\b/i

export function isFractionalQuantityUnit(unit: string): boolean {
  if (typeof unit !== 'string') return false
  return FRACTIONAL_UNIT_PATTERN.test(unit.trim())
}

export function isValidProductQuantity(quantity: number, unit: string, allowZero = false): boolean {
  if (!Number.isFinite(quantity) || (allowZero ? quantity < 0 : quantity <= 0)) return false
  if (!isFractionalQuantityUnit(unit)) return Number.isInteger(quantity)
  return Math.abs(quantity * 1000 - Math.round(quantity * 1000)) < 1e-8
}

export function getProductQuantityStep(unit: string): string {
  return isFractionalQuantityUnit(unit) ? '0.001' : '1'
}

export function formatProductQuantity(quantity: number): string {
  return quantity.toLocaleString('es-VE', { maximumFractionDigits: 3 })
}
