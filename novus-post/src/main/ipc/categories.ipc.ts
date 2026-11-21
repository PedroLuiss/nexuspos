import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { Category, CategoryInput, CategoryFilter } from '@shared/contracts'
import type { CategoryService } from '../domain/categories/category.service'

/** Registra los canales IPC del dominio Categorías. */
export function registerCategoryIpc(categories: CategoryService): void {
  ipcMain.handle(IPC_CHANNELS.categories.list, (_event, filter?: CategoryFilter) =>
    categories.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.categories.create, (_event, input: CategoryInput) =>
    categories.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.categories.update, (_event, category: Category) =>
    categories.update(category)
  )

  ipcMain.handle(IPC_CHANNELS.categories.softDelete, (_event, id: string) => {
    categories.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.categories.toggleStatus, (_event, id: string) =>
    categories.toggleStatus(id)
  )
}
