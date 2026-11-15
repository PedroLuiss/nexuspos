import {
    Product,
    CartItem,
    PaymentDetails,
    SuspendedSale
} from "@renderer/shared/types/domain"
import type { Customer, CustomerInput } from "@shared/contracts"


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
    onSuspendSale: () => void
    onResumeSale: (sale: SuspendedSale) => void
    onDeleteSuspendedSale: (id: string) => void
}