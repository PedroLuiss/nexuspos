import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { Supplier, SupplierInput, SupplierFilter } from '@shared/contracts'
import type { SupplierService } from '../domain/suppliers/supplier.service'

/** Registra los canales IPC del dominio Proveedores. */
export function registerSupplierIpc(suppliers: SupplierService): void {
  ipcMain.handle(IPC_CHANNELS.suppliers.list, (_event, filter?: SupplierFilter) =>
    suppliers.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.suppliers.getById, (_event, id: string) =>
    suppliers.getById(id)
  )

  ipcMain.handle(IPC_CHANNELS.suppliers.create, (_event, input: SupplierInput) =>
    suppliers.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.suppliers.update, (_event, supplier: Supplier) =>
    suppliers.update(supplier)
  )

  ipcMain.handle(IPC_CHANNELS.suppliers.softDelete, (_event, id: string) => {
    suppliers.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.suppliers.toggleStatus, (_event, id: string) =>
    suppliers.toggleStatus(id)
  )
}
