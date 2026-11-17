import type { CashMovement, CashRegisterData } from '@shared/contracts'
import type { SalePayment } from '@shared/contracts'

export interface OpenCashShiftRecord {
  id: string
  cashierId: string
  cashierName: string
  openedAt: string
  openingAmount: number
}

export interface CashRepository {
  getRegister(cashierId: string, shiftId?: string, includeAllCashiers?: boolean): CashRegisterData
  getActiveShift(cashierId: string): OpenCashShiftRecord | null
  openShift(cashierId: string, cashierName: string, openingAmount: number): void
  closeShift(
    shiftId: string,
    closedAt: string,
    expectedCash: number,
    countedCash: number,
    difference: number
  ): void
  insertMovement(movement: Omit<CashMovement, 'id' | 'createdAt'>): void
  insertRefund(
    saleId: string,
    shiftId: string,
    cashierId: string,
    returnedAt: string,
    amount: number,
    payment: SalePayment,
    cashAmount: number
  ): void
}
