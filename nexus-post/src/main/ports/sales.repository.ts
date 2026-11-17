import type { CreateSaleInput, SaleResult } from '@shared/contracts'
import type { CashTicket, SalePayment } from '@shared/contracts'

export interface SaleRecord extends SaleResult {
  cashierName: string
  payment: CreateSaleInput['payment']
  exchangeRate?: number
  exchangeRateUpdatedAt?: string
}

export interface SaleItemRecord {
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  unitCost: number
  discountPercent: number
  lineTotal: number
}

export interface SalesRepository {
  insertSale(sale: SaleRecord, items: SaleItemRecord[]): void
  findTicket(id: string): CashTicket | null
  markReturned(
    saleId: string,
    returnedAt: string,
    payment: SalePayment,
    cashAmount: number
  ): void
  listSuspended(cashierId: string): import('@shared/contracts').SuspendedSale[]
  saveSuspended(sale: import('@shared/contracts').SuspendedSale, cashierId: string): void
  deleteSuspended(id: string, cashierId: string): void
}
