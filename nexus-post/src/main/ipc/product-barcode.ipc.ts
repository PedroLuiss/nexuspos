import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter,
  ProductBarcodeLabelInput,
  ProductBarcodePreviewInput
} from '@shared/contracts'
import type { ProductBarcodeService } from '../domain/product-barcodes/product-barcode.service'
import type { ProductService } from '../domain/products/product.service'
import type {
  BarcodeLabelContent,
  BarcodeLabelPrinter
} from '../adapters/hardware/barcode-label-printer'
import { ValidationError } from '../domain/shared/errors'

/** Registra los canales IPC del dominio Códigos de Barras de Producto. */
export function registerProductBarcodeIpc(
  barcodes: ProductBarcodeService,
  products: ProductService,
  labelPrinter: BarcodeLabelPrinter
): void {
  ipcMain.handle(
    IPC_CHANNELS.productBarcodes.list,
    (_event, filter?: ProductBarcodeFilter) => barcodes.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.productBarcodes.create, (_event, input: ProductBarcodeInput) =>
    barcodes.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.productBarcodes.update, (_event, barcode: ProductBarcode) =>
    barcodes.update(barcode)
  )

  ipcMain.handle(IPC_CHANNELS.productBarcodes.softDelete, (_event, id: string) => {
    barcodes.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.productBarcodes.toggleStatus, (_event, id: string) =>
    barcodes.toggleStatus(id)
  )

  ipcMain.handle(
    IPC_CHANNELS.productBarcodes.previewLabel,
    (_event, input: ProductBarcodePreviewInput) =>
      labelPrinter.preview(input.barcode, input.format)
  )

  const resolveLabel = (input: ProductBarcodeLabelInput): BarcodeLabelContent => {
    const product = products.getById(input.productId)
    if (!product || product.deleted) throw new ValidationError('Producto no encontrado.')

    const activeBarcodes = barcodes
      .findByProductId(product.id)
      .filter((barcode) => barcode.active && !barcode.deleted)
    const barcode = input.barcodeId
      ? activeBarcodes.find((item) => item.id === input.barcodeId)
      : activeBarcodes.find((item) => item.isPrimary) ?? activeBarcodes[0]
    if (input.barcodeId && !barcode) {
      throw new ValidationError('El código seleccionado no está activo para este producto.')
    }

    return {
      productCode: product.code,
      productName: product.name,
      salePrice: product.salePrice,
      barcode: barcode?.barcode ?? product.code,
      format: barcode?.format ?? 'Code128',
      copies: input.copies,
      widthMm: input.widthMm,
      heightMm: input.heightMm,
      marginMm: input.marginMm,
      includePrice: input.includePrice
    }
  }

  ipcMain.handle(IPC_CHANNELS.productBarcodes.printLabels, (_event, input: ProductBarcodeLabelInput) =>
    labelPrinter.print(resolveLabel(input))
  )

  ipcMain.handle(
    IPC_CHANNELS.productBarcodes.downloadLabelsPdf,
    (_event, input: ProductBarcodeLabelInput) => labelPrinter.downloadPdf(resolveLabel(input))
  )
}
