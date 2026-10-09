export interface Product {
  id: string
  code: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  maxStock?: number
  unit: string
  hasTax: boolean
  active: boolean
  deleted?: boolean // Soft delete
  description?: string
}

export interface CartItem {
  product: Product
  quantity: number
  discountPercent: number
  customPrice?: number
  total: number
}

export type PaymentMethodType = 'cash' | 'card' | 'mixed' | 'credit'

export interface PaymentDetails {
  method: PaymentMethodType
  amountPaid: number
  change: number
  cardReference?: string
  cashAmount?: number
  cardAmount?: number
  customerId?: string
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

// Kardex Audit Movement
export type KardexMovementType = 'ENTRADA' | 'SALIDA'
export type KardexReason =
  | 'VENTA'
  | 'ENTRADA_MASIVA'
  | 'SALIDA_AJUSTE'
  | 'MERMA'
  | 'DEVOLUCION'
  | 'INVENTARIO_INICIAL'

export interface KardexMovement {
  id: string
  timestamp: string
  productId: string
  productName: string
  productCode: string
  type: KardexMovementType
  reason: KardexReason
  previousStock: number
  quantity: number
  newStock: number
  finalStock?: number
  responsibleUser: string
  notes?: string
}

// Cash Drawer Movement & Shift
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

// Customer & Accounts Receivable (Créditos)
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
  taxId: string // RFC / CIF
  phone: string
  email: string
  address: string
  creditLimit: number
  currentDebt: number
  debts: CustomerDebt[]
  payments: CustomerPayment[]
}

// Suspended Sales (Ventas en espera)
export interface SuspendedSale {
  id: string
  name: string
  timestamp: string
  items: CartItem[]
  customerName?: string
  subtotal: number
  total: number
}

// User RBAC permissions
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
