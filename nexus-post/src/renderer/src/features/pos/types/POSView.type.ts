import type {
  CartItem,
  PaymentDetails,
  Product,
  SuspendedSale
} from '@renderer/shared/types/domain'
import type { Customer, CustomerInput, UsdVesExchangeRate } from '@shared/contracts'

export interface POSViewProps {
  products: Product[]
  cart: CartItem[]
  suspendedSales: SuspendedSale[]
  customers?: Customer[]
  onAddCustomer?: (customer: CustomerInput) => Promise<Customer>
  onAddToCart: (product: Product, quantity?: number) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdateDiscount: (productId: string, discountPercent: number) => void
  onRemoveFromCart: (productId: string) => void
  onClearCart: () => void
  onCompleteSale: (details: PaymentDetails) => Promise<boolean> | boolean | void
  onSuspendSale: (sale: SuspendedSale) => Promise<boolean>
  onResumeSale: (sale: SuspendedSale) => Promise<boolean>
  onDeleteSuspendedSale: (id: string) => Promise<void>
  exchangeRate: UsdVesExchangeRate | null
  exchangeRateLoading: boolean
  exchangeRateError: string | null
  onRefreshExchangeRate: () => void
  cashierName: string
  canOverrideNoStock: boolean
  canApplyDiscount: boolean
}