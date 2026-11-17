import type { CreateSaleInput, SaleResult } from '@shared/contracts'

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
  discountPercent: number
  lineTotal: number
}

export interface SalesRepository {
  insertSale(sale: SaleRecord, items: SaleItemRecord[]): void
  listSuspended(): import('@shared/contracts').SuspendedSale[]
  saveSuspended(sale: import('@shared/contracts').SuspendedSale): void
  deleteSuspended(id: string): void
}
