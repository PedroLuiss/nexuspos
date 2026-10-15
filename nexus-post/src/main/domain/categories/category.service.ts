import type { Category, CategoryInput, CategoryFilter } from '@shared/contracts'
import type { CategoryRepository } from '../../ports/category.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeCategoryInput, validateCategoryInput } from './category.entity'

/** Servicio de dominio de categorías. Puro: solo depende de puertos y entidades. */
export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  list(filter?: CategoryFilter): Category[] {
    return this.categories.findAll(filter)
  }

  create(input: CategoryInput): Category {
    const errors = validateCategoryInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeCategoryInput(input)
    const byName = this.categories.findByName(normalized.name)
    if (byName) {
      throw new ValidationError(`La categoría "${normalized.name}" ya existe`)
    }

    const now = new Date().toISOString()
    return this.categories.create({
      ...normalized,
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(category: Category): Category {
    const existing = this.categories.findById(category.id)
    if (!existing) throw new NotFoundError('Categoría no encontrada')

    const errors = validateCategoryInput(category)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeCategoryInput(category)
    const byName = this.categories.findByName(normalized.name)
    if (byName && byName.id !== category.id) {
      throw new ValidationError(`La categoría "${normalized.name}" ya pertenece a otra`)
    }

    return this.categories.update({ ...existing, ...normalized, id: category.id })
  }

  softDelete(id: string): void {
    if (!this.categories.findById(id)) throw new NotFoundError('Categoría no encontrada')
    this.categories.softDelete(id)
  }

  toggleStatus(id: string): Category {
    if (!this.categories.findById(id)) throw new NotFoundError('Categoría no encontrada')
    return this.categories.toggleStatus(id)
  }
}
