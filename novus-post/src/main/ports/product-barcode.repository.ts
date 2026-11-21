import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter
} from '@shared/contracts'

/**
 * Puerto de persistencia de códigos de barras de producto.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface ProductBarcodeRepository {
  findAll(filter?: ProductBarcodeFilter): ProductBarcode[]
  findById(id: string): ProductBarcode | null
  findByBarcode(barcode: string): ProductBarcode | null
  findByProductId(productId: string): ProductBarcode[]
  create(
    input: ProductBarcodeInput & { id: string; createdAt: string; updatedAt: string }
  ): ProductBarcode
  update(barcode: ProductBarcode): ProductBarcode
  softDelete(id: string): void
  toggleStatus(id: string): ProductBarcode
}
