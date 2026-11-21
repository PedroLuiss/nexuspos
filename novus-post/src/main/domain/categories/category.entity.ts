import type { Category, CategoryInput } from '@shared/contracts'

/** Normaliza y sanea los datos de entrada de una categoría. */
export function normalizeCategoryInput(input: CategoryInput): CategoryInput {
  return {
    name: input.name.trim(),
    description: (input.description ?? '').trim(),
    active: input.active ?? true,
    deleted: input.deleted ?? false
  }
}

/** Reglas de validación de negocio. Devuelve la lista de errores. */
export function validateCategoryInput(input: CategoryInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('El nombre de la categor��a es obligatorio')
  if (input.name && input.name.trim().length > 60) {
    errors.push('El nombre de la categor��a no puede superar los 60 caracteres')
  }
  return errors
}

/** Aplica el borrado l��gico conservando la integridad referencial del hist��rico. */
export function softDeleteCategory(category: Category): Category {
  return { ...category, active: false, deleted: true }
}
