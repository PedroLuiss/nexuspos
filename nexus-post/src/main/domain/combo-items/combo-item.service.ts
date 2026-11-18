import type {
  ComboItem,
  ComboItemInput,
  ComboItemFilter,
  Product
} from '@shared/contracts'
import type { ComboItemRepository } from '../../ports/combo-item.repository'
import type { ProductRepository } from '../../ports/product.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeComboItemInput, validateComboItemInput } from './combo-item.entity'

/**
 * Servicio de dominio de componentes de combo. Puro: solo depende de puertos y entidades.
 * Valida que no se aniden combos y que los componentes existan.
 */
export class ComboItemService {
  constructor(
    private readonly combos: ComboItemRepository,
    private readonly products: ProductRepository
  ) {}

  list(filter?: ComboItemFilter): ComboItem[] {
    return this.combos.findAll(filter)
  }

  getById(id: string): ComboItem | null {
    return this.combos.findById(id)
  }

  findByComboId(comboId: string): ComboItem[] {
    return this.combos.findByComboId(comboId)
  }

  create(input: ComboItemInput): ComboItem {
    const errors = validateComboItemInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeComboItemInput(input)
    this.validateReferences(normalized)

    const existing = this.combos
      .findByComboId(normalized.comboId)
      .filter((item) => !item.deleted && item.componentId === normalized.componentId)
    if (existing.length > 0) {
      throw new ValidationError('Ese producto ya es un componente de este combo')
    }

    const now = new Date().toISOString()
    return this.combos.create({
      ...normalized,
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(item: ComboItem): ComboItem {
    const existing = this.combos.findById(item.id)
    if (!existing) throw new NotFoundError('Componente de combo no encontrado')

    const errors = validateComboItemInput(item)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeComboItemInput(item)
    this.validateReferences(normalized)

    const duplicate = this.combos
      .findByComboId(normalized.comboId)
      .filter(
        (i) =>
          !i.deleted &&
          i.id !== item.id &&
          i.componentId === normalized.componentId
      )
    if (duplicate.length > 0) {
      throw new ValidationError('Ese producto ya es un componente de este combo')
    }

    return this.combos.update({ ...existing, ...normalized, id: item.id })
  }

  softDelete(id: string): void {
    if (!this.combos.findById(id)) throw new NotFoundError('Componente de combo no encontrado')
    this.combos.softDelete(id)
  }

  toggleStatus(id: string): ComboItem {
    if (!this.combos.findById(id)) throw new NotFoundError('Componente de combo no encontrado')
    return this.combos.toggleStatus(id)
  }

  /** Verifica que el combo y el componente existan y que el componente no sea otro combo. */
  private validateReferences(normalized: ComboItemInput): void {
    const combo = this.products.findById(normalized.comboId)
    if (!combo || combo.deleted) {
      throw new ValidationError('El producto combo no existe')
    }
    if (combo.typeKind !== 'combo') {
      throw new ValidationError('El producto padre debe ser de tipo Combo / Kit')
    }

    const component: Product | null = this.products.findById(normalized.componentId)
    if (!component || component.deleted) {
      throw new ValidationError('El producto componente no existe')
    }
    if (component.typeKind === 'combo') {
      throw new ValidationError('No se permiten combos dentro de otros combos')
    }
  }
}
