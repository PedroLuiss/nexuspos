import type { Product, ProductInput, ProductFilter } from '@shared/contracts'
import type { ProductRepository } from '../../ports/product.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeProductInput, validateProductInput } from './product.entity'

/** Servicio de dominio de productos. Puro: solo depende de puertos y entidades. */
export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  list(filter?: ProductFilter): Product[] {
    return this.products.findAll(filter)
  }

  getById(id: string): Product | null {
    return this.products.findById(id)
  }

  create(input: ProductInput): Product {
    const errors = validateProductInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeProductInput(input)
    if (this.products.findByCode(normalized.code)) {
      throw new ValidationError(`El código "${normalized.code}" ya está registrado`)
    }

    const now = new Date().toISOString()
    return this.products.create({
      ...normalized,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(product: Product): Product {
    const existing = this.products.findById(product.id)
    if (!existing) throw new NotFoundError('Producto no encontrado')

    const errors = validateProductInput(product)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeProductInput(product)
    const byCode = this.products.findByCode(normalized.code)
    if (byCode && byCode.id !== product.id) {
      throw new ValidationError(`El código ${normalized.code} ya pertenece a otro producto`)
    }

    return this.products.update({ ...normalized, id: product.id })
  }

  softDelete(id: string): void {
    if (!this.products.findById(id)) throw new NotFoundError('Producto no encontrado')
    this.products.softDelete(id)
  }

  toggleStatus(id: string): Product {
    if (!this.products.findById(id)) throw new NotFoundError('Producto no encontrado')
    return this.products.toggleStatus(id)
  }
}
