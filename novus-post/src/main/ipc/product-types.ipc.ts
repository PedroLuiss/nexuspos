import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  ProductType,
  ProductTypeInput,
  ProductTypeFilter
} from '@shared/contracts'
import type { ProductTypeService } from '../domain/product-types/product-type.service'

/** Registra los canales IPC del dominio Tipos de Producto. */
export function registerProductTypeIpc(types: ProductTypeService): void {
  ipcMain.handle(
    IPC_CHANNELS.productTypes.list,
    (_event, filter?: ProductTypeFilter) => types.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.productTypes.getById, (_event, id: string) =>
    types.getById(id)
  )

  ipcMain.handle(
    IPC_CHANNELS.productTypes.create,
    (_event, input: ProductTypeInput) => types.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.productTypes.update, (_event, type: ProductType) =>
    types.update(type)
  )

  ipcMain.handle(IPC_CHANNELS.productTypes.softDelete, (_event, id: string) => {
    types.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.productTypes.toggleStatus, (_event, id: string) =>
    types.toggleStatus(id)
  )
}
