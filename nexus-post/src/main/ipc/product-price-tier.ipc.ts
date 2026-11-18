import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter
} from '@shared/contracts'
import type { ProductPriceTierService } from '../domain/product-price-tiers/product-price-tier.service'

/** Registra los canales IPC del dominio Precios por Mayoreo. */
export function registerProductPriceTierIpc(tiers: ProductPriceTierService): void {
  ipcMain.handle(
    IPC_CHANNELS.productPriceTiers.list,
    (_event, filter?: ProductPriceTierFilter) => tiers.list(filter)
  )

  ipcMain.handle(
    IPC_CHANNELS.productPriceTiers.create,
    (_event, input: ProductPriceTierInput) => tiers.create(input)
  )

  ipcMain.handle(IPC_CHANNELS.productPriceTiers.update, (_event, tier: ProductPriceTier) =>
    tiers.update(tier)
  )

  ipcMain.handle(IPC_CHANNELS.productPriceTiers.softDelete, (_event, id: string) => {
    tiers.softDelete(id)
  })

  ipcMain.handle(IPC_CHANNELS.productPriceTiers.toggleStatus, (_event, id: string) =>
    tiers.toggleStatus(id)
  )
}
