import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter
} from '@shared/contracts'
import type { ProductBarcodeRepository } from '../../ports/product-barcode.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import {
  normalizeProductBarcodeInput,
  validateProductBarcodeInput
} from './product-barcode.entity'

/** Servicio de dominio de códigos de barras de producto. Puro: solo depende de puertos y entidades. */
export class ProductBarcodeService {
  constructor(private readonly barcodes: ProductBarcodeRepository) {}

  list(filter?: ProductBarcodeFilter): ProductBarcode[] {
    return this.barcodes.findAll(filter)
  }

  getById(id: string): ProductBarcode | null {
    return this.barcodes.findById(id)
  }

  findByBarcode(barcode: string): ProductBarcode | null {
    return this.barcodes.findByBarcode(barcode.trim())
  }

  findByProductId(productId: string): ProductBarcode[] {
    return this.barcodes.findByProductId(productId)
  }

  create(input: ProductBarcodeInput): ProductBarcode {
    const errors = validateProductBarcodeInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const normalized = normalizeProductBarcodeInput(input)

    // El código de barras debe ser único entre los no eliminados
    const existing = this.barcodes.findByBarcode(normalized.barcode)
    if (existing && !existing.deleted) {
      throw new ValidationError(
        `El código de barras "${normalized.barcode}" ya está registrado`
      )
    }

    // Si se marca como primario, quitar la primariedad de los demás del mismo producto
    const run = this.barcodes.constructor as { transaction?: unknown }
    void run

    const now = new Date().toISOString()
    return this.barcodes.create({
      ...normalized,
      id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
  }

  update(barcode: ProductBarcode): ProductBarcode {
    const existing = this.barcodes.findById(barcode.id)
    if (!existing) throw new NotFoundError('Código de barras no encontrado')

    const errors = validateProductBarcodeInput(barcode)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const normalized = normalizeProductBarcodeInput(barcode)
    const byBarcode = this.barcodes.findByBarcode(normalized.barcode)
    if (byBarcode && byBarcode.id !== barcode.id && !byBarcode.deleted) {
      throw new ValidationError(
        `El código de barras "${normalized.barcode}" ya pertenece a otro producto`
      )
    }

    return this.barcodes.update({ ...existing, ...normalized, id: barcode.id })
  }

  softDelete(id: string): void {
    if (!this.barcodes.findById(id)) throw new NotFoundError('Código de barras no encontrado')
    this.barcodes.softDelete(id)
  }

  toggleStatus(id: string): ProductBarcode {
    if (!this.barcodes.findById(id)) throw new NotFoundError('Código de barras no encontrado')
    return this.barcodes.toggleStatus(id)
  }
}
