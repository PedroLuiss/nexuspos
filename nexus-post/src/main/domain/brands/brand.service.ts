import type { Brand, BrandInput, BrandFilter } from '@shared/contracts'
import type { BrandRepository } from '../../ports/brand.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeBrandInput, validateBrandInput } from './brand.entity'

/** Servicio de dominio de marcas. Puro: solo depende de puertos y entidades. */
export class BrandService {
  constructor(private readonly brands: BrandRepository) {}

  list(filter?: BrandFilter): Brand[] {
    return this.brands.findAll(filter)
  }

  getById(id: string): Brand | null {
    return this.brands.findById(id)
  }

  create(input: BrandInput): Brand {
    const errors = validateBrandInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeBrandInput(input)
    if (this.brands.findByName(normalized.name)) {
      throw new ValidationError(`La marca "${normalized.name}" ya existe`)
    }

    const now = new Date().toISOString()
    return this.brands.create({
      ...normalized,
      id: `brand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(brand: Brand): Brand {
    const existing = this.brands.findById(brand.id)
    if (!existing) throw new NotFoundError('Marca no encontrada')

    const errors = validateBrandInput(brand)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeBrandInput(brand)
    const byName = this.brands.findByName(normalized.name)
    if (byName && byName.id !== brand.id) {
      throw new ValidationError(`La marca "${normalized.name}" ya pertenece a otra`)
    }

    return this.brands.update({ ...existing, ...normalized, id: brand.id })
  }

  softDelete(id: string): void {
    if (!this.brands.findById(id)) throw new NotFoundError('Marca no encontrada')
    this.brands.softDelete(id)
  }

  toggleStatus(id: string): Brand {
    if (!this.brands.findById(id)) throw new NotFoundError('Marca no encontrada')
    return this.brands.toggleStatus(id)
  }
}
