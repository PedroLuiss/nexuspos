import type { ComboItemInput } from '@shared/contracts'

/** Normaliza y sanea los datos de entrada de un componente de combo. */
export function normalizeComboItemInput(input: ComboItemInput): ComboItemInput {
  return {
    comboId: (input.comboId ?? '').trim(),
    componentId: (input.componentId ?? '').trim(),
    quantity: Math.max(0.001, Number(input.quantity) || 1),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un componente de combo. */
export function validateComboItemInput(input: ComboItemInput): string[] {
  const errors: string[] = []
  if (!input.comboId?.trim()) errors.push('El combo es obligatorio')
  if (!input.componentId?.trim()) errors.push('El producto componente es obligatorio')
  if (input.comboId?.trim() && input.comboId.trim() === input.componentId?.trim()) {
    errors.push('Un combo no puede contenerse a sí mismo')
  }
  if (!Number.isFinite(Number(input.quantity)) || Number(input.quantity) <= 0) {
    errors.push('La cantidad del componente debe ser mayor a 0')
  }
  return errors
}
