import type {
  Product,
  ProductInput,
  ProductFilter,
  TaxRate,
  Brand,
  Supplier,
  ProductType
} from '@shared/contracts'
import type { ProductRepository } from '../../ports/product.repository'
import type { TaxRepository } from '../../ports/tax.repository'
import type { BrandRepository } from '../../ports/brand.repository'
import type { SupplierRepository } from '../../ports/supplier.repository'
import type { ProductTypeRepository } from '../../ports/product-type.repository'
import type { ProductBatchRepository } from '../../ports/product-batch.repository'
import type { ComboItemRepository } from '../../ports/combo-item.repository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeProductInput, validateProductInput } from './product.entity'

/** Servicio de dominio de productos. Puro: solo depende de puertos y entidades. */
export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly taxes: TaxRepository,
    private readonly brands: BrandRepository,
    private readonly suppliers: SupplierRepository,
    private readonly productTypes: ProductTypeRepository,
    private readonly batches: ProductBatchRepository,
    private readonly combos: ComboItemRepository
  ) {}

  list(filter?: ProductFilter): Product[] {
    return this.products.findAll(filter)
  }

  getById(id: string): Product | null {
    return this.products.findById(id)
  }

  listVariants(parentId: string): Product[] {
    return this.products.findByParentId(parentId)
  }

  create(input: ProductInput): Product {
    const errors = validateProductInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))

    const tax = this.resolveTax(input.taxId)
    const brand = this.resolveBrand(input.brandId)
    const supplier = this.resolveSupplier(input.supplierId)
    const type = this.resolveProductType(input.typeId)
    this.resolveParent(input.parentId)
    const normalized = normalizeProductInput({
      ...input,
      brandId: brand?.id,
      supplierId: supplier?.id,
      typeId: type?.id,
      taxId: tax?.id,
      hasTax: tax ? tax.rate > 0 : false
    })
    if (this.products.findByCode(normalized.code)) {
      throw new ValidationError(`El código "${normalized.code}" ya está registrado`)
    }

    const now = new Date().toISOString()
    const created = this.products.create({
      ...normalized,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    })
    if (created.trackBatches) this.ensureInitialBatch(created)
    return created
  }

  update(product: Product): Product {
    const existing = this.products.findById(product.id)
    if (!existing) throw new NotFoundError('Producto no encontrado')

    const errors = validateProductInput(product)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))

    const tax = this.resolveTax(product.taxId)
    const brand = this.resolveBrand(product.brandId)
    const supplier = this.resolveSupplier(product.supplierId)
    const type = this.resolveProductType(product.typeId)
    this.resolveParent(product.parentId, product.id)
    const normalized = normalizeProductInput({
      ...product,
      brandId: brand?.id,
      supplierId: supplier?.id,
      typeId: type?.id,
      taxId: tax?.id,
      hasTax: tax ? tax.rate > 0 : false
    })
    const byCode = this.products.findByCode(normalized.code)
    if (byCode && byCode.id !== product.id) {
      throw new ValidationError(`El código ${normalized.code} ya pertenece a otro producto`)
    }

    const updated = this.products.update({ ...normalized, id: product.id })
    if (updated.trackBatches && !existing.trackBatches) this.ensureInitialBatch(updated)
    return updated
  }

  /** Crea un lote inicial con el stock actual del producto si aún no tiene lotes. */
  private ensureInitialBatch(product: Product): void {
    if (this.batches.findByProductId(product.id, false).length > 0) return
    const now = new Date().toISOString()
    this.batches.create({
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId: product.id,
      batchNumber: `INICIAL-${now.slice(0, 10)}`,
      quantity: product.stock,
      active: true,
      enteredAt: now,
      createdAt: now,
      updatedAt: now
    })
  }

  softDelete(id: string): void {
    if (!this.products.findById(id)) throw new NotFoundError('Producto no encontrado')

    // Cascada de baja lógica: variantes, lotes y relaciones de combo.
    // Así el catálogo de lotes/variantes no queda con huérfanos de un producto dado de baja.
    for (const variant of this.products.findByParentId(id)) {
      this.products.softDelete(variant.id)
    }
    for (const batch of this.batches.findByProductId(id, false)) {
      this.batches.softDelete(batch.id)
    }
    for (const relation of this.combos.findAll({ includeDeleted: false })) {
      if (relation.comboId === id || relation.componentId === id) {
        this.combos.softDelete(relation.id)
      }
    }

    this.products.softDelete(id)
  }

  toggleStatus(id: string): Product {
    if (!this.products.findById(id)) throw new NotFoundError('Producto no encontrado')
    return this.products.toggleStatus(id)
  }

  /**
   * Resuelve la tasa del producto. Si no se indicó, aplica la predeterminada
   * del catálogo para que ningún producto quede sin clasificación fiscal.
   */
  private resolveTax(taxId?: string): TaxRate | null {
    let tax: TaxRate | null = null

    if (taxId?.trim()) {
      tax = this.taxes.findById(taxId.trim())
      if (!tax || tax.deleted) {
        throw new ValidationError('La tasa de impuesto seleccionada no existe.')
      }
      if (!tax.active) {
        throw new ValidationError(`La tasa "${tax.name}" está inactiva. Active otra tasa.`)
      }
      return tax
    }

    tax = this.taxes.findDefault()
    if (!tax) {
      throw new ValidationError(
        'No hay tasas de impuesto configuradas. Cree una en Ajustes › Impuestos.'
      )
    }
    return tax
  }

  /**
   * Resuelve la marca del producto. Opcional: si se proporciona, debe existir y estar activa.
   */
  private resolveBrand(brandId?: string): Brand | null {
    if (!brandId?.trim()) return null
    const brand = this.brands.findById(brandId.trim())
    if (!brand || brand.deleted) {
      throw new ValidationError('La marca seleccionada no existe.')
    }
    if (!brand.active) {
      throw new ValidationError(`La marca "${brand.name}" está inactiva.`)
    }
    return brand
  }

  /**
   * Resuelve el proveedor del producto. Opcional: si se proporciona, debe existir y estar activo.
   */
  private resolveSupplier(supplierId?: string): Supplier | null {
    if (!supplierId?.trim()) return null
    const supplier = this.suppliers.findById(supplierId.trim())
    if (!supplier || supplier.deleted) {
      throw new ValidationError('El proveedor seleccionado no existe.')
    }
    if (!supplier.active) {
      throw new ValidationError(`El proveedor "${supplier.name}" está inactivo.`)
    }
    return supplier
  }

  /**
   * Resuelve el tipo de producto. Opcional: si se proporciona, debe existir y estar activo.
   */
  private resolveProductType(typeId?: string): ProductType | null {
    if (!typeId?.trim()) return null
    const type = this.productTypes.findById(typeId.trim())
    if (!type || type.deleted) {
      throw new ValidationError('El tipo de producto seleccionado no existe.')
    }
    if (!type.active) {
      throw new ValidationError(`El tipo de producto "${type.name}" está inactivo.`)
    }
    return type
  }

  /**
   * Valida el producto padre de una variante: debe existir, no estar eliminado
   * y no puede ser a su vez una variante (se prohíben variantes anidadas).
   */
  private resolveParent(parentId?: string, currentId?: string): void {
    if (!parentId?.trim()) return
    if (currentId && parentId.trim() === currentId) {
      throw new ValidationError('Un producto no puede ser su propio padre')
    }
    const parent = this.products.findById(parentId.trim())
    if (!parent || parent.deleted) {
      throw new ValidationError('El producto padre de la variante no existe')
    }
    if (parent.parentId) {
      throw new ValidationError('No se permiten variantes dentro de otras variantes')
    }
  }
}
