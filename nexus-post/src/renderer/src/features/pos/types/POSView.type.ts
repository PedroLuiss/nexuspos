import {
    Product,
    CartItem,
    PaymentDetails,
    SuspendedSale,
    Customer
} from "@renderer/shared/types/domain"


export interface POSViewProps {
    products: Product[]
    cart: CartItem[]
    suspendedSales: SuspendedSale[]
    customers?: Customer[]
    onAddCustomer?: (customer: Omit<Customer, 'id' | 'currentDebt' | 'debts' | 'payments'>) => Customer
    onAddToCart: (product: Product, quantity?: number) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    onUpdateDiscount: (productId: string, discountPercent: number) => void
    onRemoveFromCart: (productId: string) => void
    onClearCart: () => void
    onCompleteSale: (details: PaymentDetails) => void
    onSuspendSale: () => void
    onResumeSale: (sale: SuspendedSale) => void
    onDeleteSuspendedSale: (id: string) => void
}