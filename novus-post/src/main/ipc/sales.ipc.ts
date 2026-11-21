import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { CreateSaleInput, SuspendedSale } from '@shared/contracts'
import type { SalesService } from '../domain/sales/sales.service'

export function registerSalesIpc(sales: SalesService): void {
  ipcMain.handle(IPC_CHANNELS.sales.complete, (_event, input: CreateSaleInput) =>
    sales.complete(input)
  )
  ipcMain.handle(IPC_CHANNELS.sales.listSuspended, () => sales.listSuspended())
  ipcMain.handle(IPC_CHANNELS.sales.suspend, (_event, sale: SuspendedSale) => sales.suspend(sale))
  ipcMain.handle(IPC_CHANNELS.sales.deleteSuspended, (_event, id: string) =>
    sales.deleteSuspended(id)
  )
}
