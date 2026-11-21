import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { ComboItem, ComboItemInput, ComboItemFilter } from '@shared/contracts'
import type { ComboItemService } from '../domain/combo-items/combo-item.service'

/** Registra los canales IPC del dominio Componentes de Combo. */
export function registerComboItemIpc(combos: ComboItemService): void {
  ipcMain.handle(IPC_CHANNELS.comboItems.list, (_event, filter?: ComboItemFilter) =>
    combos.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.comboItems.create, (_event, input: ComboItemInput) =>
    combos.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.comboItems.update, (_event, item: ComboItem) =>
    combos.update(item)
  )

  ipcMain.handle(IPC_CHANNELS.comboItems.softDelete, (_event, id: string) => {
    combos.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.comboItems.toggleStatus, (_event, id: string) =>
    combos.toggleStatus(id)
  )
}
