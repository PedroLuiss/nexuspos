import type { CreateSaleInput, SaleResult } from '@shared/contracts'
import type { CurrencyCode } from '@shared/contracts'
import type { CashTicket, SaleItemBatch, SalePayment } from '@shared/contracts'

export interface SaleRecord extends SaleResult {
  cashierName: string
  payment: CreateSaleInput['payment']
  exchangeRate?: number
  exchangeRateUpdatedAt?: string
  currency: CurrencyCode
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
  /** true si la línea es un combo/bundle. */
  isCombo?: boolean
  comboId?: string
  /** Lotes descontados (FEFO) en esta línea, para trazabilidad y devoluciones. */
  batches?: SaleItemBatch[]
}

export interface SalesRepository {
  insertSale(sale: SaleRecord, items: SaleItemRecord[]): void
  findTicket(id: string): CashTicket | null
  markReturned(saleId: string, returnedAt: string, payment: SalePayment, cashAmount: number): void
  listSuspended(cashierId: string): import('@shared/contracts').SuspendedSale[]
  saveSuspended(sale: import('@shared/contracts').SuspendedSale, cashierId: string): void
  deleteSuspended(id: string, cashierId: string): void
}
