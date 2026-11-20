import type { SalePayment, SaleTaxLine } from './sales.contract'
import type { UserRole } from './auth.contract'
import type { CurrencyCode } from './settings.contract'

export type CashMovementType = 'INGRESO' | 'EGRESO' | 'DEVOLUCION'
export type CashMovementSource = 'MANUAL' | 'SALE' | 'CUSTOMER_PAYMENT' | 'SALE_REFUND'

export interface CashShift {
  id: string
  cashierId: string
  cashierName: string
  stationName: string
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
  currency: CurrencyCode
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
  stationName: string
  source: CashMovementSource
  paymentMethod?: SalePayment['method']
  sourceId?: string
  currency: CurrencyCode
}

/** Lote descontado de una línea de venta (para reponer en devoluciones). */
export interface SaleItemBatch {
  batchId: string
  batchNumber: string
  /** Producto dueño del lote (un combo puede consumir lotes de varios componentes). */
  productId: string
  quantity: number
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
  /** true si la línea es un combo/bundle (el stock se descontó de sus componentes). */
  isCombo?: boolean
  /** id del producto combo cuando isCombo = true. */
  comboId?: string
  /** Lotes FEFO descontados en esta línea (para reponer exactamente al devolver). */
  batches?: SaleItemBatch[]
}

export interface CashTicket {
  id: string
  shiftId: string
  ticketNumber: string
  soldAt: string
  cashierName: string
  stationName: string
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
  currency: CurrencyCode
}

export type CashShiftOption = Pick<
  CashShift,
  | 'id'
  | 'cashierId'
  | 'openedAt'
  | 'closedAt'
  | 'cashierName'
  | 'stationName'
  | 'openingAmount'
  | 'currency'
  | 'expectedCash'
  | 'countedCash'
  | 'difference'
  | 'totalSales'
  | 'ticketCount'
> & {
  cashierRole?: UserRole
}

export interface CashierMonitorEntry {
  cashierId: string
  cashierName: string
  stationName: string
  isActive: boolean
  activeShift: CashShiftOption | null
}

export interface CashRegisterData {
  shift: CashShift | null
  activeShiftId?: string
  shiftOptions: CashShiftOption[]
  cashierMonitor: CashierMonitorEntry[]
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
