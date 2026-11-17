import type { Supplier, SupplierInput, SupplierFilter } from '@shared/contracts'
import type { SupplierRepository } from '../../ports/supplier.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeSupplierInput, validateSupplierInput } from './supplier.entity'

/** Servicio de dominio de proveedores. Puro: solo depende de puertos y entidades. */
export class SupplierService {
  constructor(private readonly suppliers: SupplierRepository) {}

  list(filter?: SupplierFilter): Supplier[] {
    return this.suppliers.findAll(filter)
  }

  getById(id: string): Supplier | null {
    return this.suppliers.findById(id)
  }

  create(input: SupplierInput): Supplier {
    const errors = validateSupplierInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeSupplierInput(input)
    if (this.suppliers.findByName(normalized.name)) {
      throw new ValidationError(`El proveedor "${normalized.name}" ya existe`)
    }

    const now = new Date().toISOString()
    return this.suppliers.create({
      ...normalized,
      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(supplier: Supplier): Supplier {
    const existing = this.suppliers.findById(supplier.id)
    if (!existing) throw new NotFoundError('Proveedor no encontrado')

    const errors = validateSupplierInput(supplier)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeSupplierInput(supplier)
    const byName = this.suppliers.findByName(normalized.name)
    if (byName && byName.id !== supplier.id) {
      throw new ValidationError(`El proveedor "${normalized.name}" ya pertenece a otro`)
    }

    return this.suppliers.update({ ...existing, ...normalized, id: supplier.id })
  }

  softDelete(id: string): void {
    if (!this.suppliers.findById(id)) throw new NotFoundError('Proveedor no encontrado')
    this.suppliers.softDelete(id)
  }

  toggleStatus(id: string): Supplier {
    if (!this.suppliers.findById(id)) throw new NotFoundError('Proveedor no encontrado')
    return this.suppliers.toggleStatus(id)
  }
}
