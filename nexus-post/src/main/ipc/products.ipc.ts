import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { Product, ProductInput, ProductFilter } from '@shared/contracts'
import type { ProductService } from '../domain/products/product.service'

/** Registra los canales IPC del dominio Productos. */
export function registerProductIpc(products: ProductService): void {
  ipcMain.handle(IPC_CHANNELS.products.list, (_event, filter?: ProductFilter) =>
    products.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.products.getById, (_event, id: string) => products.getById(id))

  ipcMain.handle(IPC_CHANNELS.products.create, (_event, input: ProductInput) =>
    products.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.products.update, (_event, product: Product) =>
    products.update(product)
  )

  ipcMain.handle(IPC_CHANNELS.products.softDelete, (_event, id: string) => {
    products.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.products.toggleStatus, (_event, id: string) =>
    products.toggleStatus(id)
  )
}
