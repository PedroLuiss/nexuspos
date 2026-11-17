import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { Brand, BrandInput, BrandFilter } from '@shared/contracts'
import type { BrandService } from '../domain/brands/brand.service'

/** Registra los canales IPC del dominio Marcas. */
export function registerBrandIpc(brands: BrandService): void {
  ipcMain.handle(IPC_CHANNELS.brands.list, (_event, filter?: BrandFilter) =>
    brands.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.brands.getById, (_event, id: string) =>
    brands.getById(id)
  )

  ipcMain.handle(IPC_CHANNELS.brands.create, (_event, input: BrandInput) =>
    brands.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.brands.update, (_event, brand: Brand) =>
    brands.update(brand)
  )

  ipcMain.handle(IPC_CHANNELS.brands.softDelete, (_event, id: string) => {
    brands.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.brands.toggleStatus, (_event, id: string) =>
    brands.toggleStatus(id)
  )
}
