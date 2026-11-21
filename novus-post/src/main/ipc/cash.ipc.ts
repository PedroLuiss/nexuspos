import { ipcMain } from 'electron'
import {
  IPC_CHANNELS,
  type CloseCashShiftInput,
  type CreateCashMovementInput,
  type OpenCashShiftInput
} from '@shared/contracts'
import type { CashService } from '../domain/cash/cash.service'

export function registerCashIpc(cash: CashService): void {
  ipcMain.handle(IPC_CHANNELS.cash.getRegister, (_event, shiftId?: string) =>
    cash.getRegister(shiftId)
  )
  ipcMain.handle(IPC_CHANNELS.cash.openShift, (_event, input: OpenCashShiftInput) =>
    cash.openShift(input)
  )
  ipcMain.handle(IPC_CHANNELS.cash.closeShift, (_event, input: CloseCashShiftInput) =>
    cash.closeShift(input)
  )
  ipcMain.handle(IPC_CHANNELS.cash.addMovement, (_event, input: CreateCashMovementInput) =>
    cash.addMovement(input)
  )
  ipcMain.handle(IPC_CHANNELS.cash.returnSale, (_event, saleId: string) => cash.returnSale(saleId))
}
