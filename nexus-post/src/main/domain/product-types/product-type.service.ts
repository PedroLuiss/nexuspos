import type { ProductType, ProductTypeInput, ProductTypeFilter } from '@shared/contracts'
import type { ProductTypeRepository } from '../../ports/product-type.repository'
import type { AuthService } from '../auth/auth.service'
import { getCoreProductType } from '@shared/contracts'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeProductTypeInput, validateProductTypeInput } from './product-type.entity'

/** Servicio de dominio de tipos de producto. Puro: solo depende de puertos y entidades. */
export class ProductTypeService {
  constructor(
    private readonly types: ProductTypeRepository,
    private readonly auth: AuthService
  ) {}

  list(filter?: ProductTypeFilter): ProductType[] {
    return this.types.findAll(filter)
  }

  getById(id: string): ProductType | null {
    return this.types.findById(id)
  }

  create(input: ProductTypeInput): ProductType {
    this.requireAdmin()
    if (!input || typeof input.name !== 'string') {
      throw new ValidationError('El nombre del tipo de producto es obligatorio')
    }

    const simpleTypeInput: ProductTypeInput = { ...input, kind: 'simple', trackStock: true }
    const errors = validateProductTypeInput(simpleTypeInput)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeProductTypeInput(simpleTypeInput)
    if (this.types.findByName(normalized.name)) {
      throw new ValidationError(`El tipo de producto "${normalized.name}" ya existe`)
    }

    const now = new Date().toISOString()
    return this.types.create({
      ...normalized,
      id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(type: ProductType): ProductType {
    this.requireAdmin()
    if (!type || typeof type.id !== 'string' || typeof type.name !== 'string') {
      throw new ValidationError('Los datos del tipo de producto no son válidos.')
    }

    const existing = this.types.findById(type.id)
    if (!existing) throw new NotFoundError('Tipo de producto no encontrado')

    const coreType = getCoreProductType(type.id)
    if (coreType) {
      if (
        type.name.trim() !== coreType.name ||
        type.kind !== coreType.kind ||
        type.trackStock !== coreType.trackStock ||
        !type.active ||
        type.deleted
      ) {
        throw new ValidationError(
          'Los tipos operativos del sistema no se pueden renombrar, desactivar ni modificar.'
        )
      }
      return existing
    }

    const simpleTypeInput: ProductTypeInput = { ...type, kind: 'simple', trackStock: true }
    const errors = validateProductTypeInput(simpleTypeInput)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeProductTypeInput(simpleTypeInput)
    const byName = this.types.findByName(normalized.name)
    if (byName && byName.id !== type.id) {
      throw new ValidationError(`El tipo de producto "${normalized.name}" ya pertenece a otro`)
    }

    return this.types.update({ ...existing, ...normalized, id: type.id })
  }

  softDelete(id: string): void {
    this.requireAdmin()
    const existing = this.types.findById(id)
    if (!existing || existing.deleted) {
      throw new NotFoundError('Tipo de producto no encontrado')
    }
    if (getCoreProductType(id)) {
      throw new ValidationError('Los tipos operativos del sistema no se pueden eliminar.')
    }

    const productCount = this.types.countProducts(id)
    if (productCount > 0) {
      throw new ValidationError(
        `No se puede eliminar "${existing.name}": está asociado a ${productCount} producto${productCount === 1 ? '' : 's'}. Reasigne esos productos primero.`
      )
    }

    this.types.softDelete(id)
  }

  toggleStatus(id: string): ProductType {
    this.requireAdmin()
    if (!this.types.findById(id)) throw new NotFoundError('Tipo de producto no encontrado')
    if (getCoreProductType(id)) {
      throw new ValidationError('Los tipos operativos del sistema no se pueden desactivar.')
    }
    return this.types.toggleStatus(id)
  }

  private requireAdmin(): void {
    const user = this.auth.getSessionUser()
    if (!user) throw new ValidationError('Debe iniciar sesión para administrar catálogos.')
    if (user.role !== 'ADMIN') {
      throw new ValidationError('Solo el Administrador puede modificar los tipos de producto.')
    }
  }
}
