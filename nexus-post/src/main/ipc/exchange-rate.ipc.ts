import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { ExchangeRateService } from '../domain/exchange-rate/exchange-rate.service'

export function registerExchangeRateIpc(service: ExchangeRateService): void {
  ipcMain.handle(IPC_CHANNELS.exchangeRate.getUsdVes, () => service.getUsdVes())
  ipcMain.handle(IPC_CHANNELS.exchangeRate.getEurVes, () => service.getEurVes())
}
