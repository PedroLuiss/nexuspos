import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter
} from '@shared/contracts'
import type { ProductBarcodeService } from '../domain/product-barcodes/product-barcode.service'

/** Registra los canales IPC del dominio Códigos de Barras de Producto. */
export function registerProductBarcodeIpc(barcodes: ProductBarcodeService): void {
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
}
