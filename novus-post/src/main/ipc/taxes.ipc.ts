import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { TaxInput, TaxRate } from '@shared/contracts'
import type { TaxService } from '../domain/taxes/tax.service'

/** Registra los canales IPC del catálogo de impuestos. */
export function registerTaxIpc(taxes: TaxService): void {
  ipcMain.handle(IPC_CHANNELS.taxes.list, (_event, includeInactive?: boolean) =>
    taxes.list(includeInactive ?? true)
  )

  ipcMain.handle(IPC_CHANNELS.taxes.create, (_event, input: TaxInput) => taxes.create(input))

  ipcMain.handle(IPC_CHANNELS.taxes.update, (_event, tax: TaxRate) => taxes.update(tax))

  ipcMain.handle(IPC_CHANNELS.taxes.remove, (_event, id: string) => {
    taxes.remove(id)
  })

  ipcMain.handle(IPC_CHANNELS.taxes.setDefault, (_event, id: string) => taxes.setDefault(id))
}
