import type {
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter
} from '@shared/contracts'
import type { ProductPriceTierRepository } from '../../ports/product-price-tier.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import {
  normalizeProductPriceTierInput,
  validateProductPriceTierInput
} from './product-price-tier.entity'
import type { AuthService } from '../auth/auth.service'

/** Servicio de dominio de precios por mayoreo. Puro: solo depende de puertos y entidades. */
export class ProductPriceTierService {
  constructor(
    private readonly tiers: ProductPriceTierRepository,
    private readonly auth: AuthService
  ) {}

  list(filter?: ProductPriceTierFilter): ProductPriceTier[] {
    return this.tiers.findAll(filter)
  }

  getById(id: string): ProductPriceTier | null {
    return this.tiers.findById(id)
  }

  findByProductId(productId: string): ProductPriceTier[] {
    return this.tiers.findByProductId(productId)
  }

  /**
   * Resuelve el precio aplicable para una cantidad dada.
   * Busca el tier activo cuya rango [minQuantity, maxQuantity] contenga la cantidad.
   * Si hay varios, elige el de mayor minQuantity (más específico). Si no hay match, devuelve null.
   */
  resolvePrice(
    productId: string,
    quantity: number
  ): { tier: ProductPriceTier; price: number } | null {
    const tiers = this.tiers
      .findByProductId(productId)
      .filter((t) => !t.deleted && t.active && t.minQuantity <= quantity)

    const applicable = tiers.filter(
      (t) => t.maxQuantity === undefined || t.maxQuantity === null || quantity <= t.maxQuantity
    )

    if (applicable.length === 0) return null

    // El más específico: mayor minQuantity
    applicable.sort((a, b) => b.minQuantity - a.minQuantity)
    const tier = applicable[0]
    return { tier, price: tier.price }
  }

  create(input: ProductPriceTierInput): ProductPriceTier {
    this.requirePricePermission()
    const errors = validateProductPriceTierInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeProductPriceTierInput(input)

    // Validar solapamiento con otros tiers activos del mismo producto
    const existing = this.tiers
      .findByProductId(normalized.productId)
      .filter((t) => !t.deleted && t.active)
    for (const t of existing) {
      const aMin = normalized.minQuantity
      const aMax = normalized.maxQuantity ?? Infinity
      const bMin = t.minQuantity
      const bMax = t.maxQuantity ?? Infinity
      if (aMin <= bMax && bMin <= aMax) {
        throw new ValidationError(
          `El rango se solapa con un tier existente (${bMin}-${bMax ?? '∞'})`
        )
      }
    }

    const now = new Date().toISOString()
    return this.tiers.create({
      ...normalized,
      id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(tier: ProductPriceTier): ProductPriceTier {
    this.requirePricePermission()
    const existing = this.tiers.findById(tier.id)
    if (!existing) throw new NotFoundError('Precio por mayoreo no encontrado')

    const errors = validateProductPriceTierInput(tier)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeProductPriceTierInput(tier)

    // Validar solapamiento excluyendo el propio tier
    const existingTiers = this.tiers
      .findByProductId(normalized.productId)
      .filter((t) => !t.deleted && t.active && t.id !== tier.id)
    for (const t of existingTiers) {
      const aMin = normalized.minQuantity
      const aMax = normalized.maxQuantity ?? Infinity
      const bMin = t.minQuantity
      const bMax = t.maxQuantity ?? Infinity
      if (aMin <= bMax && bMin <= aMax) {
        throw new ValidationError(
          `El rango se solapa con un tier existente (${bMin}-${bMax ?? '∞'})`
        )
      }
    }

    return this.tiers.update({ ...existing, ...normalized, id: tier.id })
  }

  softDelete(id: string): void {
    this.requirePricePermission()
    if (!this.tiers.findById(id)) throw new NotFoundError('Precio por mayoreo no encontrado')
    this.tiers.softDelete(id)
  }

  toggleStatus(id: string): ProductPriceTier {
    this.requirePricePermission()
    if (!this.tiers.findById(id)) throw new NotFoundError('Precio por mayoreo no encontrado')
    return this.tiers.toggleStatus(id)
  }

  private requirePricePermission(): void {
    this.auth.requirePermission('inventory', 'El usuario no tiene acceso al módulo de inventario.')
    this.auth.requirePermission(
      'CAN_MODIFY_PRICE',
      'El usuario no tiene permiso para modificar precios por mayoreo.'
    )
  }
}
