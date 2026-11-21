import type { Product } from '@shared/contracts/product.contract'
import type { SaleCartItem, SalePayment, SuspendedSale } from '@shared/contracts/sales.contract'

export type { Product, ProductInput, ProductFilter } from '@shared/contracts/product.contract'
export type {
  KardexMovementType,
  KardexReason,
  KardexMovement
} from '@shared/contracts/inventory.contract'

export type CartItem = SaleCartItem

export type PaymentMethodType = SalePayment['method']

export interface PaymentDetails extends SalePayment {
  customerId?: string
  ticketNumber?: string
}

export interface SaleSummary {
  id: string
  ticketNumber: string
  timestamp: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment: PaymentDetails
  cashierName: string
  customerName?: string
}

export type ActiveTab =
  | 'pos'
  | 'products'
  | 'kardex'
  | 'cash'
  | 'customers'
  | 'reports'
  | 'settings'

export interface ReportKPI {
  totalSales: number
  netProfit: number
  averageTicket: number
  totalTransactions: number
  growthPercent: number
}

export interface SalesChartPoint {
  label: string
  date: string
  sales: number
  profit: number
  ticketCount: number
}

export interface CashMovement {
  id: string
  timestamp: string
  type: 'INGRESO' | 'EGRESO'
  amount: number
  concept: string
  user: string
}

export interface ShiftState {
  isOpen: boolean
  openedAt: string
  initialAmount: number
  cashier: string
  totalCashSales: number
  totalCardSales: number
  totalMixedSales: number
  totalCreditSales: number
  extraIncomes: number
  extraExpenses: number
}

export interface CustomerDebt {
  id: string
  ticketNumber: string
  date: string
  total: number
  balance: number
  totalAmount?: number
  pendingAmount?: number
}

export interface CustomerPayment {
  id: string
  date: string
  amount: number
  concept: string
  cashier: string
}

export interface Customer {
  id: string
  code: string
  name: string
  taxId: string
  phone: string
  email: string
  address: string
  creditLimit: number
  currentDebt: number
  debts: CustomerDebt[]
  payments: CustomerPayment[]
}

export type { SuspendedSale }

export interface UserPermissions {
  canDeleteProduct: boolean
  canSeeReports: boolean
  canApplyDiscount: boolean
  canModifyPrice: boolean
  canManualCashMovements: boolean
  canOverrideNoStock: boolean
}

export interface POSUser {
  id: string
  username: string
  fullName: string
  role: 'admin' | 'supervisor' | 'cashier'
  permissions: UserPermissions
}
