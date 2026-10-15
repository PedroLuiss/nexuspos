import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { AdjustStockInput } from '@shared/contracts'
import type { InventoryService } from '../domain/inventory/inventory.service'

/** Registra los canales IPC del dominio Inventario / Kardex. */
export function registerInventoryIpc(inventory: InventoryService): void {
  ipcMain.handle(IPC_CHANNELS.inventory.adjustStock, (_event, input: AdjustStockInput) =>
    inventory.adjustStock(input)
  )

  ipcMain.handle(IPC_CHANNELS.inventory.listMovements, (_event, productId?: string) =>
    inventory.listMovements(productId)
  )
}
