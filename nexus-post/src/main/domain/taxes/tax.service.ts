import type { TaxInput, TaxRate } from '@shared/contracts'
import type { TaxRepository } from '../../ports/tax.repository'
import type { AuthService } from '../auth/auth.service'
import { NotFoundError, ValidationError } from '../shared/errors'
import { canDeleteTax, normalizeTaxInput, validateTaxInput } from './tax.entity'

/**
 * Servicio de dominio del catálogo de impuestos.
 *
 * - Lectura pública: el POS y el formulario de productos necesitan las tasas.
 * - Escritura restringida a ADMIN (configuración tributaria del negocio).
 * - Solo puede existir una tasa predeterminada; se aplica a productos nuevos.
 */
export class TaxService {
  constructor(
    private readonly taxes: TaxRepository,
    private readonly auth: AuthService
  ) {}

  list(includeInactive = true): TaxRate[] {
    return this.taxes.findAll(includeInactive)
  }

  getById(id: string): TaxRate | null {
    return this.taxes.findById(id)
  }

  create(input: TaxInput): TaxRate {
    this.requireAdmin()
    const errors = validateTaxInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeTaxInput(input)
    if (this.taxes.findByName(normalized.name)) {
      throw new ValidationError(`Ya existe una tasa llamada "${normalized.name}".`)
    }

    const now = new Date().toISOString()
    return this.taxes.create({
      ...normalized,
      id: `tax-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(tax: TaxRate): TaxRate {
    this.requireAdmin()
    const existing = this.taxes.findById(tax.id)
    if (!existing || existing.deleted) throw new NotFoundError('La tasa de impuesto no existe.')

    const errors = validateTaxInput(tax)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeTaxInput(tax)
    const byName = this.taxes.findByName(normalized.name)
    if (byName && byName.id !== tax.id) {
      throw new ValidationError(`Ya existe una tasa llamada "${normalized.name}".`)
    }

    return this.taxes.update({
      ...existing,
      ...normalized,
      id: tax.id,
      isDefault: tax.isDefault ?? existing.isDefault
    })
  }

  remove(id: string): void {
    this.requireAdmin()
    const existing = this.taxes.findById(id)
    if (!existing || existing.deleted) throw new NotFoundError('La tasa de impuesto no existe.')

    const blocked = canDeleteTax({
      ...existing,
      productCount: this.taxes.countProducts(id)
    })
    if (blocked) throw new ValidationError(blocked)

    this.taxes.softDelete(id)
  }

  setDefault(id: string): TaxRate {
    this.requireAdmin()
    const existing = this.taxes.findById(id)
    if (!existing || existing.deleted) throw new NotFoundError('La tasa de impuesto no existe.')
    return this.taxes.setDefault(id)
  }

  private requireAdmin(): void {
    const session = this.auth.getSessionUser()
    if (!session) {
      throw new ValidationError('No hay una sesión activa. Inicie sesión nuevamente.')
    }
    if (session.role !== 'ADMIN') {
      throw new ValidationError(
        'Acceso denegado: solo el Administrador puede modificar el catálogo de impuestos.'
      )
    }
  }
}
