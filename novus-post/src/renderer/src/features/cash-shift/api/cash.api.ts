import type {
  CashApi,
  CashRegisterData,
  CashTicket,
  CloseCashShiftInput,
  CreateCashMovementInput,
  OpenCashShiftInput
} from '@shared/contracts'

export const cashApi: CashApi = {
  getRegister: (shiftId?: string): Promise<CashRegisterData> => window.api.cash.getRegister(shiftId),
  openShift: (input: OpenCashShiftInput): Promise<CashRegisterData> =>
    window.api.cash.openShift(input),
  closeShift: (input: CloseCashShiftInput): Promise<CashRegisterData> =>
    window.api.cash.closeShift(input),
  addMovement: (input: CreateCashMovementInput): Promise<CashRegisterData> =>
    window.api.cash.addMovement(input),
  returnSale: (saleId: string): Promise<CashTicket> => window.api.cash.returnSale(saleId)
}

export function cashErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
