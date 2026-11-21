import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { ProductBatch, ProductBatchInput, ProductBatchFilter } from '@shared/contracts'
import type { ProductBatchService } from '../domain/product-batches/product-batch.service'

/** Registra los canales IPC del dominio Lotes y caducidad. */
export function registerProductBatchIpc(batches: ProductBatchService): void {
  ipcMain.handle(IPC_CHANNELS.productBatches.list, (_event, filter?: ProductBatchFilter) =>
    batches.list(filter)
  )

  ipcMain.handle(IPC_CHANNELS.productBatches.receive, (_event, input: ProductBatchInput) =>
    batches.receive(input)
  )

  ipcMain.handle(IPC_CHANNELS.productBatches.update, (_event, batch: ProductBatch) =>
    batches.update(batch)
  )

  ipcMain.handle(IPC_CHANNELS.productBatches.softDelete, (_event, id: string) => {
    batches.softDelete(id)
  })
}
