import React, { useState } from 'react'
import {
  ActiveTab,
  Product,
  CartItem,
  PaymentDetails,
  KardexMovement,
  KardexReason,
  CashMovement,
  ShiftState,
  Customer,
  SuspendedSale
} from './shared/types/domain'
import { HotkeysProvider, useRouter } from './app/providers/HotkeysProvider'
import DashboardLayout from './app/DashboardLayout'
import POSView from './features/pos/POSView'
import ProductTable from './features/inventory/components/ProductTable'
import KardexView from './features/kardex/KardexView'
import CashShiftView from './features/cash-shift/CashShiftView'
import CustomersView from './features/customers/CustomersView'
import ReportsView from './features/reports/ReportsView'
import SettingsGrid from './features/settings/SettingsGrid'
import { CheckCircle2 } from './shared/icons/Icons'

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

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    code: 'CLI-101',
    name: 'Don Pancho Abarrotes San José',
    taxId: 'FRP780512-AB2',
    phone: '55-4433-2211',
    email: 'pancho.sanjose@gmail.com',
    address: 'Av. Hidalgo #45, Col. Centro',
    creditLimit: 12000,
    currentDebt: 3450.0,
    debts: [
      { id: 'd-1', ticketNumber: 'TK-00810', date: '04/10/2026', total: 2150.0, balance: 1450.0 },
      { id: 'd-2', ticketNumber: 'TK-00819', date: '06/10/2026', total: 2000.0, balance: 2000.0 }
    ],
    payments: [
      { id: 'p-1', date: '05/10/2026', amount: 700.0, concept: 'Abono en efectivo', cashier: 'Carlos Morales' }
    ]
  },
  {
    id: 'cust-2',
    code: 'CLI-102',
    name: 'Carnicería & Cremería El Güero',
    taxId: 'GUE850920-K19',
    phone: '55-8899-7766',
    email: 'elguero.carnes@outlook.com',
    address: 'Calle Juárez #112',
    creditLimit: 8000,
    currentDebt: 1800.0,
    debts: [
      { id: 'd-3', ticketNumber: 'TK-00815', date: '05/10/2026', total: 1800.0, balance: 1800.0 }
    ],
    payments: []
  },
  {
    id: 'cust-3',
    code: 'CLI-103',
    name: 'Sra. Rosaura Martínez (Vecina Frecuente)',
    taxId: 'XAXX010101000',
    phone: '55-1122-3344',
    email: 'rosaura.mtz@gmail.com',
    address: 'Privada Los Álamos #8',
    creditLimit: 3000,
    currentDebt: 0.0,
    debts: [],
    payments: [
      { id: 'p-2', date: '07/10/2026', amount: 450.0, concept: 'Liquidación total', cashier: 'Carlos Morales' }
    ]
  }
]

const INITIAL_KARDEX: KardexMovement[] = [
  {
    id: 'k-1',
    timestamp: '08/10/2026 08:30:15',
    productId: 'prod-1',
    productName: 'Refresco Coca-Cola 600ml Desechable',
    productCode: '7501055300075',
    type: 'ENTRADA',
    reason: 'INVENTARIO_INICIAL',
    previousStock: 0,
    quantity: 50,
    newStock: 50,
    responsibleUser: 'Admin Sistema',
    notes: 'Apertura inicial de inventario'
  },
  {
    id: 'k-2',
    timestamp: '08/10/2026 09:14:02',
    productId: 'prod-1',
    productName: 'Refresco Coca-Cola 600ml Desechable',
    productCode: '7501055300075',
    type: 'SALIDA',
    reason: 'VENTA',
    previousStock: 50,
    quantity: 2,
    newStock: 48,
    responsibleUser: 'Carlos Morales',
    notes: 'Ticket #TK-00820'
  },
  {
    id: 'k-3',
    timestamp: '08/10/2026 09:45:20',
    productId: 'prod-5',
    productName: 'Detergente Polvo Ariel Doble Poder 1Kg',
    productCode: '7501006543210',
    type: 'SALIDA',
    reason: 'MERMA',
    previousStock: 10,
    quantity: 2,
    newStock: 8,
    responsibleUser: 'Carlos Morales',
    notes: 'Bolsa rota en transporte'
  },
  {
    id: 'k-4',
    timestamp: '08/10/2026 10:12:44',
    productId: 'prod-2',
    productName: 'Leche Entera Alpura 1 Litro Tetrapak',
    productCode: '7501020512341',
    type: 'ENTRADA',
    reason: 'ENTRADA_MASIVA',
    previousStock: 12,
    quantity: 12,
    newStock: 24,
    responsibleUser: 'Carlos Morales',
    notes: 'Factura F-4581 Proveedor Alpura'
  }
]

function AppContent(): React.JSX.Element {
  const { activeTab } = useRouter()
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [kardex, setKardex] = useState<KardexMovement[]>(INITIAL_KARDEX)

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

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(
    null
  )

  const showToast = (message: string, type: 'success' | 'info' = 'success'): void => {
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
  const handleCompleteSale = (details: PaymentDetails): void => {
    const saleTotal = cart.reduce((acc, i) => acc + i.product.salePrice * i.quantity * (1 - i.discountPercent / 100), 0)

    // Log each cart item in Kardex and deduct product stock
    cart.forEach((item) => {
      const prevStock = item.product.stock
      const newStock = Math.max(0, prevStock - item.quantity)

      // Add to Kardex
      const mov: KardexMovement = {
        id: `k-${Date.now()}-${item.product.id}`,
        timestamp: new Date().toLocaleString('es-MX'),
        productId: item.product.id,
        productName: item.product.name,
        productCode: item.product.code,
        type: 'SALIDA',
        reason: 'VENTA',
        previousStock: prevStock,
        quantity: item.quantity,
        newStock: newStock,
        responsibleUser: shift.cashier,
        notes: `Cobro en caja (${details.method})`
      }
      setKardex((kPrev) => [mov, ...kPrev])

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
    }

    showToast(`¡Venta cobrada con éxito! ($${saleTotal.toFixed(2)})`)
    setCart([])
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

  // Stock Adjustment (Entradas / Salidas Masivas) -> Logs directly to Kardex
  const handleStockAdjustment = (
    productId: string,
    quantity: number,
    reason: KardexReason,
    notes: string
  ): void => {
    const prod = products.find((p) => p.id === productId)
    if (!prod) return

    const isInput =
      reason === 'ENTRADA_MASIVA' || reason === 'INVENTARIO_INICIAL' || reason === 'DEVOLUCION'
    const prevStock = prod.stock
    const newStock = isInput ? prevStock + quantity : Math.max(0, prevStock - quantity)

    const mov: KardexMovement = {
      id: `k-${Date.now()}`,
      timestamp: new Date().toLocaleString('es-MX'),
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      type: isInput ? 'ENTRADA' : 'SALIDA',
      reason,
      previousStock: prevStock,
      quantity,
      newStock,
      responsibleUser: shift.cashier,
      notes
    }

    setKardex((prev) => [mov, ...prev])
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    )
    showToast(
      `Ajuste de stock registrado: ${isInput ? '+' : '-'}${quantity} ${prod.unit} (${reason})`
    )
  }

  // Product CRUD
  const handleAddProduct = (newProduct: Omit<Product, 'id'>): void => {
    const product: Product = {
      ...newProduct,
      id: `prod-${Date.now()}`
    }
    setProducts((prev) => [product, ...prev])

    // Log initial stock in Kardex
    if (product.stock > 0) {
      const mov: KardexMovement = {
        id: `k-${Date.now()}`,
        timestamp: new Date().toLocaleString('es-MX'),
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        type: 'ENTRADA',
        reason: 'INVENTARIO_INICIAL',
        previousStock: 0,
        quantity: product.stock,
        newStock: product.stock,
        responsibleUser: shift.cashier,
        notes: 'Registro inicial de nuevo producto'
      }
      setKardex((prev) => [mov, ...prev])
    }

    showToast(`Producto "${product.name}" creado en catálogo`)
  }

  const handleUpdateProduct = (updatedProduct: Product): void => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    )
    showToast(`Producto "${updatedProduct.name}" modificado`)
  }

  // Soft delete product
  const handleDeleteProduct = (id: string): void => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: false, deleted: true } : p))
    )
    showToast('Producto desactivado (Soft Delete para conservar integridad referencial)', 'info')
  }

  const handleToggleStatus = (id: string): void => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextActive = !p.active
          showToast(`Producto ${nextActive ? 'activado' : 'desactivado'}`)
          return { ...p, active: nextActive }
        }
        return p
      })
    )
  }

  // Customer Management & Abonos
  const handleAddCustomer = (
    customerData: Omit<Customer, 'id' | 'currentDebt' | 'debts' | 'payments'>
  ): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      currentDebt: 0,
      debts: [],
      payments: []
    }
    setCustomers((prev) => [newCust, ...prev])
    showToast(`Cliente "${newCust.name}" registrado`)
    return newCust
  }

  const handleAddCustomerPayment = (customerId: string, amount: number, concept: string): void => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.currentDebt - amount)
          const newPay = {
            id: `p-${Date.now()}`,
            date: new Date().toLocaleDateString('es-MX'),
            amount,
            concept,
            cashier: shift.cashier
          }
          return {
            ...c,
            currentDebt: newDebt,
            payments: [newPay, ...c.payments]
          }
        }
        return c
      })
    )

    // Add to cash drawer extra incomes
    setShift((s) => ({
      ...s,
      extraIncomes: s.extraIncomes + amount
    }))

    showToast(`Abono de $${amount.toFixed(2)} registrado e ingresado a gaveta de caja`)
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

  const totalDebtorsCount = customers.filter((c) => c.currentDebt > 0).length

  return (
    <DashboardLayout>
      {/* Toast Alert Feedback */}
      {notification && (
        <div className="absolute top-3 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-white text-xs rounded-sm shadow-xl border border-slate-700 animate-modal backdrop-blur-xs select-none">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="font-semibold">{notification.message}</span>
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
      {activeTab === 'products' && (
        <ProductTable
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleStatus={handleToggleStatus}
          onStockAdjustment={handleStockAdjustment}
        />
      )}

      {/* 3. MÓDULO DE KARDEX (AUDITORÍA INMUTABLE) */}
      {activeTab === 'kardex' && <KardexView movements={kardex} />}

      {/* 4. MÓDULO DE CAJA (CORTE DE TURNO) */}
      {activeTab === 'cash' && (
        <CashShiftView
          shift={shift}
          cashMovements={cashMovements}
          onAddCashMovement={handleAddCashMovement}
          onCloseShift={handleCloseShift}
        />
      )}

      {/* 5. MÓDULO DE CLIENTES (CRÉDITOS Y CUENTAS POR COBRAR) */}
      {activeTab === 'customers' && (
        <CustomersView
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onAddPayment={handleAddCustomerPayment}
        />
      )}

      {/* 6. MÓDULO DE REPORTES Y MÉTRICAS */}
      {activeTab === 'reports' && <ReportsView />}

      {/* 7. MÓDULO DE AJUSTES DEL SISTEMA */}
      {activeTab === 'settings' && <SettingsGrid />}
    </DashboardLayout>
  )
}

export function App(): React.JSX.Element {
  return (
    <HotkeysProvider>
      <AppContent />
    </HotkeysProvider>
  )
}

export default App
