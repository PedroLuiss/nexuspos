import type { Category, CategoryInput, CategoryFilter } from '@shared/contracts'

/** Acceso tipado al puente IPC expuesto por el preload (`window.api`). */
function bridge(): Window['api'] {
  if (typeof window === 'undefined' || !window.api) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api
}

export const categoriesApi = {
  list: (filter?: CategoryFilter): Promise<Category[]> => bridge().categories.list(filter),
  create: (input: CategoryInput): Promise<Category> => bridge().categories.create(input),
  update: (category: Category): Promise<Category> => bridge().categories.update(category),
  softDelete: (id: string): Promise<void> => bridge().categories.softDelete(id),
  toggleStatus: (id: string): Promise<Category> => bridge().categories.toggleStatus(id)
}
