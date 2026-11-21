import type { ProductTypeInput } from '@shared/contracts'

const MAX_TYPE_NAME_LENGTH = 64

/** Normaliza y sanea los datos de entrada de un tipo de producto. */
export function normalizeProductTypeInput(input: ProductTypeInput): ProductTypeInput {
  return {
    name: (input.name ?? '').trim().slice(0, MAX_TYPE_NAME_LENGTH),
    kind: input.kind ?? 'simple',
    trackStock: input.trackStock ?? true,
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un tipo de producto. */
export function validateProductTypeInput(input: ProductTypeInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('El nombre del tipo de producto es obligatorio')
  const validKinds = ['simple', 'combo', 'service', 'raw_material']
  if (!validKinds.includes(input.kind ?? '')) {
    errors.push('El tipo debe ser: simple, combo, service o raw_material')
  }
  return errors
}
