import type { TaxInput, TaxRate } from '@shared/contracts'
import { normalizeTaxRate } from '@shared/lib/tax'

const MAX_TAX_NAME_LENGTH = 32
const MAX_TAX_CODE_LENGTH = 4

/** Normaliza y sanea los datos editables de una tasa. */
export function normalizeTaxInput(input: TaxInput): TaxInput {
  const rate = normalizeTaxRate(input.rate)
  return {
    name: (input.name ?? '').trim().slice(0, MAX_TAX_NAME_LENGTH),
    rate,
    code: (input.code ?? '').trim().toUpperCase().slice(0, MAX_TAX_CODE_LENGTH) || undefined,
    isDefault: Boolean(input.isDefault),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio del catálogo de impuestos. */
export function validateTaxInput(input: TaxInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('El nombre del impuesto es obligatorio')
  if (!Number.isFinite(Number(input.rate))) errors.push('La tasa debe ser un número válido')
  if (Number(input.rate) < 0 || Number(input.rate) > 100) {
    errors.push('La tasa debe estar entre 0 y 100%')
  }
  return errors
}

/** Bloquea el borrado de tasas en uso para no romper productos ni historial fiscal. */
export function canDeleteTax(tax: TaxRate): string | null {
  if (tax.isDefault) return 'No se puede eliminar la tasa predeterminada. Elija otra primero.'
  if ((tax.productCount ?? 0) > 0) {
    return `La tasa "${tax.name}" está asignada a ${tax.productCount} producto(s). Reasígnelos antes de eliminarla.`
  }
  return null
}
