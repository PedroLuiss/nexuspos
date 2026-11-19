import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { AdjustStockInput, KardexExportFormat, KardexMovementQuery } from '@shared/contracts'
import { KardexExporter } from '../adapters/export/kardex-exporter'
import type { InventoryService } from '../domain/inventory/inventory.service'
import type { SettingsService } from '../domain/settings/settings.service'

/** Registra los canales IPC del dominio Inventario / Kardex. */
export function registerInventoryIpc(inventory: InventoryService, settings: SettingsService): void {
  const exporter = new KardexExporter()

  ipcMain.handle(IPC_CHANNELS.inventory.adjustStock, (_event, input: AdjustStockInput) =>
    inventory.adjustStock(input)
  )

  ipcMain.handle(IPC_CHANNELS.inventory.listMovements, (_event, query: KardexMovementQuery) =>
    inventory.listMovements(query)
  )

  ipcMain.handle(
    IPC_CHANNELS.inventory.exportMovements,
    async (_event, query: KardexMovementQuery, format: KardexExportFormat) => {
      if (format !== 'XLSX' && format !== 'PDF') {
        throw new Error('El formato de exportación no es válido.')
      }
      const movements = inventory.listAllMovements(query)
      return exporter.export(movements, query, format, settings.getBusiness())
    }
  )
}
