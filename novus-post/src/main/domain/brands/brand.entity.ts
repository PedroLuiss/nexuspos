import type { BrandInput } from '@shared/contracts'

const MAX_BRAND_NAME_LENGTH = 64
const MAX_BRAND_DESCRIPTION_LENGTH = 200

/** Normaliza y sanea los datos de entrada de una marca. */
export function normalizeBrandInput(input: BrandInput): BrandInput {
  return {
    name: (input.name ?? '').trim().slice(0, MAX_BRAND_NAME_LENGTH),
    description: (input.description ?? '').trim().slice(0, MAX_BRAND_DESCRIPTION_LENGTH),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de una marca. */
export function validateBrandInput(input: BrandInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('El nombre de la marca es obligatorio')
  return errors
}
