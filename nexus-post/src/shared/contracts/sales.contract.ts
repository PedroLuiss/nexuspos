import type { Product } from './product.contract'

export type SalePaymentMethod = 'cash' | 'card' | 'mixed' | 'credit'

export interface SalePayment {
  method: SalePaymentMethod
  amountPaid: number
  change: number
  cardReference?: string
  cashAmount?: number
  cardAmount?: number
}

export interface SaleCartItem {
  product: Product
  quantity: number
  discountPercent: number
  customPrice?: number
  total: number
}

export interface SuspendedSale {
  id: string
  cashierId?: string
  ticketNumber?: string
  name: string
  timestamp: string
  items: SaleCartItem[]
  customerId?: string
  customerName?: string
  subtotal: number
  total: number
}

/** Desglose de impuesto por tasa dentro de una venta (16%, 8%, exento…). */
export interface SaleTaxLine {
  taxId?: string
  taxName: string
  /** Tasa en porcentaje (16 = 16%). */
  taxRate: number
  /** Base gravable sobre la que se calculó el impuesto. */
  taxableBase: number
  amount: number
}

export interface CreateSaleItemInput {
  productId: string
  quantity: number
  discountPercent: number
}

export interface CreateSaleInput {
  ticketNumber: string
  customerId?: string
  items: CreateSaleItemInput[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payment: SalePayment
  exchangeRate?: number
  exchangeRateUpdatedAt?: string
  /** Desglose informativo; el backend siempre lo recalcula. */
  taxBreakdown?: SaleTaxLine[]
}

export interface SaleResult {
  id: string
  cashShiftId: string
  ticketNumber: string
  soldAt: string
  subtotal: number
  discount: number
  tax: number
  total: number
  customerId?: string
  /** Desglose por tasa guardado en `sale_taxes`. */
  taxBreakdown?: SaleTaxLine[]
}

export interface SalesApi {
  complete(input: CreateSaleInput): Promise<SaleResult>
  listSuspended(): Promise<SuspendedSale[]>
  suspend(sale: SuspendedSale): Promise<void>
  deleteSuspended(id: string): Promise<void>
}
