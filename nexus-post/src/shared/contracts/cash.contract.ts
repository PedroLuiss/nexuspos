import type { SalePayment, SaleTaxLine } from './sales.contract'

export type CashMovementType = 'INGRESO' | 'EGRESO' | 'DEVOLUCION'
export type CashMovementSource = 'MANUAL' | 'SALE' | 'CUSTOMER_PAYMENT' | 'SALE_REFUND'

export interface CashShift {
  id: string
  cashierId: string
  cashierName: string
  openedAt: string
  openingAmount: number
  isOpen: boolean
  closedAt?: string
  expectedCash: number
  countedCash?: number
  difference?: number
  cashSales: number
  cardSales: number
  mixedSales: number
  creditSales: number
  customerPayments: number
  manualIncomes: number
  manualExpenses: number
  cashRefunds: number
  totalSales: number
  totalRefunds: number
  grossProfit: number
  taxCollected: number
  ticketCount: number
}

export interface CashMovement {
  id: string
  shiftId: string
  createdAt: string
  type: CashMovementType
  amount: number
  cashEffect: number
  concept: string
  cashierName: string
  source: CashMovementSource
  paymentMethod?: SalePayment['method']
  sourceId?: string
}

export interface CashSaleItem {
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  unitCost: number
  discountPercent: number
  lineTotal: number
}

export interface CashTicket {
  id: string
  shiftId: string
  ticketNumber: string
  soldAt: string
  cashierName: string
  customerId?: string
  customerName?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  /** Desglose por tasa (ventas nuevas; queda vacío en tickets históricos). */
  taxBreakdown?: SaleTaxLine[]
  payment: SalePayment
  items: CashSaleItem[]
  returnedAt?: string
  returnPayment?: SalePayment
  returnCashAmount: number
}

export interface CashRegisterData {
  shift: CashShift | null
  activeShiftId?: string
  shiftOptions: Array<
    Pick<CashShift, 'id' | 'openedAt' | 'closedAt' | 'cashierName' | 'openingAmount'> &
      Pick<CashShift, 'expectedCash' | 'countedCash' | 'difference'>
  >
  movements: CashMovement[]
  tickets: CashTicket[]
}

export interface OpenCashShiftInput {
  openingAmount: number
}

export interface CloseCashShiftInput {
  countedCash: number
}

export interface CreateCashMovementInput {
  type: 'INGRESO' | 'EGRESO'
  amount: number
  concept: string
}

export interface CashApi {
  getRegister(shiftId?: string): Promise<CashRegisterData>
  openShift(input: OpenCashShiftInput): Promise<CashRegisterData>
  closeShift(input: CloseCashShiftInput): Promise<CashRegisterData>
  addMovement(input: CreateCashMovementInput): Promise<CashRegisterData>
  returnSale(saleId: string): Promise<CashTicket>
}
