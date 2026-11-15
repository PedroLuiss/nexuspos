import React, { useEffect, useState } from 'react'
import {
  Product,
  CartItem,
  PaymentDetails,
  CashMovement,
  ShiftState,
  SuspendedSale
} from './shared/types/domain'
import { HotkeysProvider, useRouter } from './app/providers/HotkeysProvider'
import DashboardLayout from './app/DashboardLayout'
import { BusinessConfigProvider } from './app/providers/BusinessConfigProvider'
import POSView from './features/pos/POSView'
import ProductTable from './features/inventory/components/ProductTable'
import KardexView from './features/kardex/KardexView'
import CashShiftView from './features/cash-shift/CashShiftView'
import CustomersView from './features/customers/CustomersView'
import ReportsView from './features/reports/ReportsView'
import SettingsGrid from './features/settings/SettingsGrid'
import { CheckCircle2 } from './shared/icons/Icons'
import type { Customer, CustomerPayment, User } from '@shared/contracts'
import { LoginView } from './features/auth'
import { logoutApi } from './features/auth/api/auth.api'
import { canAccessTab } from './shared/lib/permissions'
import { useBusinessConfig } from './shared/hooks/useBusinessConfig'
import { computeGrandTotal } from './shared/lib/businessConfig'
import { useCustomers } from './features/customers/hooks/useCustomers'
import { useKardex } from './features/kardex/hooks/useKardex'

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: '7501055300075',
    name: 'Refresco Coca-Cola 600ml Desechable',
    category: 'Bebidas y Refrescos',
    costPrice: 13.5,
    salePrice: 18.0,
    stock: 48,
    minStock: 10,
    maxStock: 120,
    unit: 'Pieza (pza)',
    hasTax: true,
    active: true,
    description: 'Bebida carbonatada botella PET'
  },
  {
    id: 'prod-2',
    code: '7501020512341',
    name: 'Leche Entera Alpura 1 Litro Tetrapak',
    category: 'Lácteos y Quesos',
    costPrice: 21.0,
    salePrice: 27.0,
    stock: 24,
    minStock: 8,
    maxStock: 80,
    unit: 'Litro (lt)',
    hasTax: false,
    active: true,
    description: 'Leche 100% pura de vaca ultrapasteurizada'
  },
  {
    id: 'prod-3',
    code: '7501000111209',
    name: 'Pan Blanco Bimbo Grande 680g',
    category: 'Alimentos y Abarrotes',
    costPrice: 36.0,
    salePrice: 45.0,
    stock: 15,
    minStock: 5,
    maxStock: 50,
    unit: 'Paquete (paq)',
    hasTax: false,
    active: true,
    description: 'Pan de caja tradicional con ajonjolí'
  },
  {
    id: 'prod-4',
    code: '7501011122334',
    name: 'Papas Sabritas Clásicas Sal 45g',
    category: 'Snacks y Golosinas',
    costPrice: 15.0,
    salePrice: 21.0,
    stock: 35,
    minStock: 12,
    maxStock: 90,
    unit: 'Pieza (pza)',
    hasTax: true,
    active: true,
    description: 'Papas fritas con sal de grano'
  },
  {
    id: 'prod-5',
    code: '7501006543210',
    name: 'Detergente Polvo Ariel Doble Poder 1Kg',
    category: 'Limpieza y Hogar',
    costPrice: 32.5,
    salePrice: 42.0,
    stock: 8,
    minStock: 10,
    maxStock: 40,
    unit: 'Kilogramo (kg)',
    hasTax: true,
    active: true,
    description: 'Detergente concentrado multiusos para ropa'
  },
  {
    id: 'prod-6',
    code: '7501030405060',
    name: 'Agua Purificada Bonafont 1.5L',
    category: 'Bebidas y Refrescos',
    costPrice: 9.0,
    salePrice: 15.0,
    stock: 60,
    minStock: 15,
    maxStock: 150,
    unit: 'Pieza (pza)',
    hasTax: false,
    active: true,
    description: 'Agua ligera natural sin sodio'
  },
  {
    id: 'prod-7',
    code: '7501077889900',
    name: 'Jabón de Tocador Palmolive Neutro 120g',
    category: 'Cuidado Personal',
    costPrice: 12.0,
    salePrice: 17.5,
    stock: 3,
    minStock: 6,
    maxStock: 30,
    unit: 'Pieza (pza)',
    hasTax: true,
    active: true,
    description: 'Jabón hipoalergénico barra'
  },
  {
    id: 'prod-8',
    code: '7501099887766',
    name: 'Galletas Marías Gamesa 170g',
    category: 'Snacks y Golosinas',
    costPrice: 11.5,
    salePrice: 16.0,
    stock: 0,
    minStock: 10,
    maxStock: 60,
    unit: 'Paquete (paq)',
    hasTax: true,
    active: false,
    description: 'Galletas tradicionales paquete'
  }
]

function AppContent(): React.JSX.Element {
  const { activeTab } = useRouter()
  const { config: businessConfig } = useBusinessConfig()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const {
    movements: kardexMovements,
    isLoading: isKardexLoading,
    error: kardexError,
    reload: reloadKardex
  } = useKardex(Boolean(currentUser) && activeTab === 'kardex')
  const {
    customers,
    error: customersError,
    reload: reloadCustomers,
    createCustomer,
    createCreditSale
  } = useCustomers(Boolean(currentUser))

  useEffect(() => {
    if (currentUser && activeTab === 'pos') {
      void reloadCustomers()
    }
  }, [activeTab, currentUser, reloadCustomers])

  // Cart
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: INITIAL_PRODUCTS[0],
      quantity: 2,
      discountPercent: 0,
      total: 36.0
    },
    {
      product: INITIAL_PRODUCTS[1],
      quantity: 1,
      discountPercent: 0,
      total: 27.0
    }
  ])

  // Suspended Sales
  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([
    {
      id: 'susp-1',
      name: 'Ticket #00822 (Cliente en Coche)',
      timestamp: '08/10/2026 10:45 AM',
      items: [
        { product: INITIAL_PRODUCTS[3], quantity: 2, discountPercent: 0, total: 42.0 },
        { product: INITIAL_PRODUCTS[5], quantity: 1, discountPercent: 0, total: 15.0 }
      ],
      subtotal: 57.0,
      total: 57.0
    }
  ])

  // Cash shift state
  const [shift, setShift] = useState<ShiftState>({
    isOpen: true,
    openedAt: '08/10/2026 08:00 AM',
    initialAmount: 1500.0,
    cashier: 'Carlos Morales',
    totalCashSales: 4850.0,
    totalCardSales: 3200.0,
    totalMixedSales: 1100.0,
    totalCreditSales: 1800.0,
    extraIncomes: 400.0,
    extraExpenses: 180.0
  })

  const [cashMovements, setCashMovements] = useState<CashMovement[]>([
    {
      id: 'cm-1',
      timestamp: '09:20 AM',
      type: 'EGRESO',
      amount: 180.0,
      concept: 'Compra de bolsas plásticas para empaque',
      user: 'Carlos Morales'
    },
    {
      id: 'cm-2',
      timestamp: '10:05 AM',
      type: 'INGRESO',
      amount: 400.0,
      concept: 'Ingreso de monedas y cambio de bóveda',
      user: 'Carlos Morales'
    }
  ])

  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'info' | 'error'
  } | null>(
    null
  )

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success'): void => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }



  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1): void => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
              ...item,
              quantity: item.quantity + quantity,
              total:
                (item.quantity + quantity) *
                item.product.salePrice *
                (1 - item.discountPercent / 100)
            }
            : item
        )
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            discountPercent: 0,
            total: quantity * product.salePrice
          }
        ]
      }
    })
    showToast(`Artículo "${product.name}" agregado`)
  }

  const handleUpdateQuantity = (productId: string, quantity: number): void => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
            ...item,
            quantity,
            total: quantity * item.product.salePrice * (1 - item.discountPercent / 100)
          }
          : item
      )
    )
  }

  const handleUpdateDiscount = (productId: string, discountPercent: number): void => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
            ...item,
            discountPercent,
            total: item.quantity * item.product.salePrice * (1 - discountPercent / 100)
          }
          : item
      )
    )
  }

  const handleRemoveFromCart = (productId: string): void => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = (): void => {
    setCart([])
    showToast('Venta cancelada y ticket limpiado', 'info')
  }

  // Complete Sale -> Deducts stock and logs to Kardex
  const handleCompleteSale = async (details: PaymentDetails): Promise<boolean> => {
    if (cart.length === 0) return false
    const netTotal = cart.reduce(
      (acc, i) => acc + i.product.salePrice * i.quantity * (1 - i.discountPercent / 100),
      0
    )
    const taxableBase = cart
      .filter((item) => item.product.hasTax)
      .reduce(
        (acc, i) => acc + i.product.salePrice * i.quantity * (1 - i.discountPercent / 100),
        0
      )
    // Importe realmente cobrado según la configuración de IVA vigente en Ajustes.
    const saleTotal = computeGrandTotal(netTotal, taxableBase, businessConfig)

    if (details.method === 'credit') {
      if (!details.customerId) {
        showToast('Seleccione un cliente antes de registrar una venta a crédito.', 'error')
        return false
      }
      try {
        await createCreditSale({
          customerId: details.customerId,
          ticketNumber: details.ticketNumber ?? `TK-${Date.now()}`,
          totalAmount: saleTotal,
          date: new Date().toISOString()
        })
        await reloadCustomers()
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'No se pudo registrar la venta a crédito.',
          'error'
        )
        return false
      }
    }

    // POS products are currently demo data; do not write false audit records to SQLite.
    cart.forEach((item) => {
      const prevStock = item.product.stock
      const newStock = Math.max(0, prevStock - item.quantity)

      // Deduct stock in catalog
      setProducts((pPrev) =>
        pPrev.map((p) => (p.id === item.product.id ? { ...p, stock: newStock } : p))
      )
    })

    // Update shift cash totals
    if (details.method === 'cash') {
      setShift((s) => ({ ...s, totalCashSales: s.totalCashSales + saleTotal }))
    } else if (details.method === 'card') {
      setShift((s) => ({ ...s, totalCardSales: s.totalCardSales + saleTotal }))
    } else if (details.method === 'mixed') {
      setShift((s) => ({
        ...s,
        totalCashSales: s.totalCashSales + (details.cashAmount || 0),
        totalCardSales: s.totalCardSales + (details.cardAmount || 0),
        totalMixedSales: s.totalMixedSales + saleTotal
      }))
    } else if (details.method === 'credit') {
      setShift((s) => ({ ...s, totalCreditSales: s.totalCreditSales + saleTotal }))
    }

    showToast(`¡Venta cobrada con éxito! ($${saleTotal.toFixed(2)})`)
    setCart([])
    return true
  }

  // Suspend current sale
  const handleSuspendSale = (): void => {
    if (cart.length === 0) return
    const sub = cart.reduce((acc, i) => acc + i.product.salePrice * i.quantity, 0)
    const newSuspended: SuspendedSale = {
      id: `susp-${Date.now()}`,
      name: `Ticket #${1000 + suspendedSales.length} (${cart[0].product.name.slice(0, 15)}...)`,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      subtotal: sub,
      total: sub * 1.16
    }
    setSuspendedSales((prev) => [newSuspended, ...prev])
    setCart([])
    showToast('Venta pausada y guardada en espera', 'info')
  }

  // Resume suspended sale
  const handleResumeSale = (sale: SuspendedSale): void => {
    setCart(sale.items)
    setSuspendedSales((prev) => prev.filter((s) => s.id !== sale.id))
    showToast(`Venta "${sale.name}" recuperada a caja`)
  }

  const handleDeleteSuspendedSale = (id: string): void => {
    setSuspendedSales((prev) => prev.filter((s) => s.id !== id))
    showToast('Venta en espera descartada', 'info')
  }

  const handleAddCustomer = async (
    customerData: Omit<Customer, 'id' | 'currentDebt' | 'active' | 'deleted' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer> => {
    const newCustomer = await createCustomer(customerData)
    showToast(`Cliente "${newCustomer.name}" registrado`)
    return newCustomer
  }

  const handleCustomerPaymentReceived = (payment: CustomerPayment): void => {
    setShift((current) => ({
      ...current,
      extraIncomes: current.extraIncomes + payment.amount
    }))
    setCashMovements((current) => [
      {
        id: payment.id,
        timestamp: new Date(payment.date).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'INGRESO',
        amount: payment.amount,
        concept: payment.concept,
        user: payment.cashierName
      },
      ...current
    ])
    showToast(`Abono de $${payment.amount.toFixed(2)} registrado e ingresado a gaveta de caja`)
  }

  // Cash shift manual entries/exits
  const handleAddCashMovement = (movement: Omit<CashMovement, 'id' | 'timestamp'>): void => {
    const newMov: CashMovement = {
      ...movement,
      id: `cm-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }
    setCashMovements((prev) => [newMov, ...prev])

    if (movement.type === 'INGRESO') {
      setShift((s) => ({ ...s, extraIncomes: s.extraIncomes + movement.amount }))
    } else {
      setShift((s) => ({ ...s, extraExpenses: s.extraExpenses + movement.amount }))
    }

    showToast(`Movimiento de caja (${movement.type}): $${movement.amount.toFixed(2)}`)
  }

  const handleCloseShift = (countedCash: number): void => {
    showToast(`Turno cerrado exitosamente. Efectivo físico verificado: $${countedCash.toFixed(2)}`)
  }

  // Cierre de sesión: limpia backend + estado local del operador.
  const handleLogout = async (): Promise<void> => {
    try {
      // logoutApi nunca lanza: si el canal IPC/SQLite no está listo, la sesión local se cierra igual.
      await logoutApi()
    } finally {
      setCart([])
      setCurrentUser(null)
    }
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />
  }

  return (
      <DashboardLayout currentUser={currentUser} onLogout={handleLogout}>
        {/* Toast Alert Feedback */}
        {notification && (
          <div className="absolute top-3 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-white text-xs rounded-sm shadow-xl border border-slate-700 animate-modal backdrop-blur-xs select-none">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className={`font-semibold ${notification.type === 'error' ? 'text-red-300' : ''}`}>
              {notification.message}
            </span>
          </div>
        )}
        {customersError && (
          <div
            role="alert"
            className="absolute top-14 right-4 z-50 max-w-md rounded border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-[#C42B1C] shadow-lg"
          >
            No se pudieron cargar los clientes: {customersError}
          </div>
        )}

        {/* 1. MÓDULO DE VENTAS (POS) */}
        {activeTab === 'pos' && (
          <POSView
            products={products}
            cart={cart}
            suspendedSales={suspendedSales}
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateDiscount={handleUpdateDiscount}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            onSuspendSale={handleSuspendSale}
            onResumeSale={handleResumeSale}
            onDeleteSuspendedSale={handleDeleteSuspendedSale}
          />
        )}

        {/* 2. MÓDULO DE INVENTARIO Y PRODUCTOS */}
        {activeTab === 'products' && canAccessTab(currentUser, 'products') && <ProductTable />}

        {/* 3. MÓDULO DE KARDEX (AUDITORÍA INMUTABLE) */}
        {activeTab === 'kardex' && canAccessTab(currentUser, 'kardex') && (
          <KardexView
            movements={kardexMovements}
            isLoading={isKardexLoading}
            error={kardexError}
            onRefresh={() => void reloadKardex()}
          />
        )}

        {/* 4. MÓDULO DE CAJA (CORTE DE TURNO) */}
        {activeTab === 'cash' && canAccessTab(currentUser, 'cash') && (
          <CashShiftView
            shift={shift}
            cashMovements={cashMovements}
            onAddCashMovement={handleAddCashMovement}
            onCloseShift={handleCloseShift}
          />
        )}

        {/* 5. MÓDULO DE CLIENTES (CRÉDITOS Y CUENTAS POR COBRAR) */}
        {activeTab === 'customers' && canAccessTab(currentUser, 'customers') && (
          <CustomersView
            onPaymentReceived={handleCustomerPaymentReceived}
          />
        )}

        {/* 6. MÓDULO DE REPORTES Y MÉTRICAS */}
        {activeTab === 'reports' && canAccessTab(currentUser, 'reports') && <ReportsView />}

        {/* 7. MÓDULO DE AJUSTES DEL SISTEMA */}
        {activeTab === 'settings' && canAccessTab(currentUser, 'settings') && (
          <SettingsGrid currentUser={currentUser} />
        )}
      </DashboardLayout>
      )
}

      export function App(): React.JSX.Element {
  return (
      <HotkeysProvider>
        <BusinessConfigProvider>
          <AppContent />
        </BusinessConfigProvider>
      </HotkeysProvider>
      )
}

      export default App
