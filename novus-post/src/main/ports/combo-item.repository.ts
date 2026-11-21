import type { ComboItem, ComboItemInput, ComboItemFilter } from '@shared/contracts'

/**
 * Puerto de persistencia de componentes de combo.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface ComboItemRepository {
  findAll(filter?: ComboItemFilter): ComboItem[]
  findById(id: string): ComboItem | null
  findByComboId(comboId: string): ComboItem[]
  create(input: ComboItemInput & { id: string; createdAt: string; updatedAt: string }): ComboItem
  update(item: ComboItem): ComboItem
  softDelete(id: string): void
  toggleStatus(id: string): ComboItem
}
