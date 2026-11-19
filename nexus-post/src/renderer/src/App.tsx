import React, { useCallback, useEffect, useState } from 'react'
import { Product, CartItem, PaymentDetails, SuspendedSale } from './shared/types/domain'
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
import ToastAlert from './shared/ui/ToastAlert'
import { useToast } from './shared/hooks/useToast'
import type {
  CashRegisterData,
  CloseCashShiftInput,
  CreateCashMovementInput,
  Customer,
  OpenCashShiftInput,
  User
} from '@shared/contracts'
import { LoginView } from './features/auth'
import { logoutApi } from './features/auth/api/auth.api'
import { canAccessTab } from './shared/lib/permissions'
import { useBusinessConfig } from './shared/hooks/useBusinessConfig'
import { useAllPriceTiers } from './shared/hooks/useAllPriceTiers'
import { computeSaleTotals, resolveProductTax } from '@shared/lib/tax'
import { resolveUnitPrice } from '@shared/lib/product-pricing'
import { useCustomers } from './features/customers/hooks/useCustomers'
import { useKardex } from './features/kardex/hooks/useKardex'
import { useUsdVesRate } from './features/pos/hooks/useUsdVesRate'
import { posProductsApi } from './features/pos/api/products.api'
import { salesApi, salesErrorMessage } from './features/pos/api/sales.api'
import { cashApi, cashErrorMessage } from './features/cash-shift/api/cash.api'
import { isValidProductQuantity } from '@shared/lib/product-quantity'

function AppContent(): React.JSX.Element {
  const { activeTab } = useRouter()
  const { config: businessConfig } = useBusinessConfig()
  const { tiersByProduct: appTiersByProduct } = useAllPriceTiers()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const {
    rate: usdVesRate,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
    refresh: refreshExchangeRate
  } = useUsdVesRate(Boolean(currentUser))
  const {
    data: kardexData,
    query: kardexQuery,
    setQuery: setKardexQuery,
    isLoading: isKardexLoading,
    error: kardexError,
    reload: reloadKardex,
    exportMovements: exportKardexMovements
  } = useKardex(Boolean(currentUser) && activeTab === 'kardex')
  const {
    customers,
    error: customersError,
    reload: reloadCustomers,
    createCustomer
  } = useCustomers(Boolean(currentUser))

  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([])

  useEffect(() => {
    if (currentUser && activeTab === 'pos') {
      void reloadCustomers()
    }
  }, [activeTab, currentUser, reloadCustomers])

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])

  // Cash shift state
  const [cashRegister, setCashRegister] = useState<CashRegisterData>({
    shift: null,
    shiftOptions: [],
    movements: [],
    tickets: []
  })
  const [isCashLoading, setIsCashLoading] = useState(false)
  const [cashError, setCashError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Alerta animada global (feedback de ventas, caja y cierre de sesión).
  const { toast, showToast, dismissToast } = useToast()

  const reloadCashRegister = useCallback(
    async (shiftId?: string): Promise<void> => {
      setIsCashLoading(true)
      try {
        const register = await cashApi.getRegister(shiftId)
        setCashRegister(register)
        setCashError(null)
      } catch (error: unknown) {
        const message = cashErrorMessage(error)
        setCashError(message)
        showToast(`No se pudo cargar la caja: ${message}`, 'error')
      } finally {
        setIsCashLoading(false)
      }
    },
    [showToast]
  )

  useEffect(() => {
    if (!currentUser || !cashRegister.activeShiftId) return

    let cancelled = false
    void salesApi
      .listSuspended()
      .then((sales) => {
        if (!cancelled) setSuspendedSales(sales)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          showToast(
            `No se pudieron cargar las ventas en espera: ${salesErrorMessage(error)}`,
            'error'
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [currentUser, cashRegister.activeShiftId, showToast])

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1): void => {
    const catalogProduct = product
    if (!catalogProduct.active || catalogProduct.deleted) {
      showToast('El producto ya no está disponible en el catálogo.', 'error')
      return
    }
    if (!isValidProductQuantity(quantity, catalogProduct.unit)) {
      showToast(
        'La cantidad debe ser entera para productos por unidad o decimal para productos medibles.',
        'error'
      )
      return
    }
    const alreadyInCart = cart.find((item) => item.product.id === product.id)?.quantity ?? 0
    if (catalogProduct.trackStock !== false && catalogProduct.stock <= 0) {
      showToast(`"${catalogProduct.name}" no tiene existencias y no se puede facturar.`, 'error')
      return
    }
    if (
      catalogProduct.trackStock !== false &&
      !currentUser?.permissions?.includes('CAN_OVERRIDE_NO_STOCK') &&
      alreadyInCart + quantity > catalogProduct.stock
    ) {
      showToast(`Stock insuficiente para "${catalogProduct.name}".`, 'error')
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total:
                  resolveUnitPrice(
                    appTiersByProduct.get(catalogProduct.id),
                    item.quantity + quantity,
                    catalogProduct.salePrice
                  ) *
                  (item.quantity + quantity) *
                  (1 - item.discountPercent / 100)
              }
            : item
        )
      } else {
        return [
          ...prev,
          {
            product: catalogProduct,
            quantity,
            discountPercent: 0,
            total:
              resolveUnitPrice(
                appTiersByProduct.get(catalogProduct.id),
                quantity,
                catalogProduct.salePrice
              ) * quantity
          }
        ]
      }
    })
    showToast(`Artículo "${product.name}" agregado`)
  }

  const handleUpdateQuantity = (productId: string, quantity: number): void => {
    const currentItem = cart.find((item) => item.product.id === productId)
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }
    if (currentItem && !isValidProductQuantity(quantity, currentItem.product.unit)) {
      showToast(
        isValidProductQuantity(0.001, currentItem.product.unit)
          ? 'Ingrese una cantidad positiva con hasta 3 decimales.'
          : 'Este producto solo se vende en cantidades enteras.',
        'error'
      )
      return
    }
    if (currentItem && currentItem.product.trackStock !== false) {
      if (currentItem.product.stock <= 0) {
        showToast(
          `"${currentItem.product.name}" no tiene existencias y no se puede facturar.`,
          'error'
        )
        return
      }
      if (
        !currentUser?.permissions?.includes('CAN_OVERRIDE_NO_STOCK') &&
        quantity > currentItem.product.stock
      ) {
        showToast(`Stock insuficiente para "${currentItem.product.name}".`, 'error')
        return
      }
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total:
                resolveUnitPrice(
                  appTiersByProduct.get(item.product.id),
                  quantity,
                  item.product.salePrice
                ) *
                quantity *
                (1 - item.discountPercent / 100)
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
              total:
                resolveUnitPrice(
                  appTiersByProduct.get(item.product.id),
                  item.quantity,
                  item.product.salePrice
                ) *
                item.quantity *
                (1 - discountPercent / 100)
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

  const handleCompleteSale = async (details: PaymentDetails): Promise<boolean> => {
    if (cart.length === 0) return false
    const unavailableItem = cart.find(
      (item) => item.product.trackStock !== false && item.product.stock <= 0
    )
    if (unavailableItem) {
      showToast(
        `"${unavailableItem.product.name}" no tiene existencias y no se puede facturar.`,
        'error'
      )
      return false
    }
    const totals = computeSaleTotals(
      cart.map((item) => {
        const tax = resolveProductTax(item.product, businessConfig)
        return {
          unitPrice: item.product.salePrice,
          priceTiers: appTiersByProduct.get(item.product.id),
          quantity: item.quantity,
          discountPercent: item.discountPercent,
          taxId: tax.taxId,
          taxName: tax.taxName,
          taxRate: tax.taxRate
        }
      }),
      {
        taxEnabled: businessConfig.taxEnabled,
        pricesIncludeTax: businessConfig.pricesIncludeTax
      }
    )
    const saleTotal = totals.total

    try {
      const { customerId, ticketNumber, ...payment } = details
      await salesApi.complete({
        ticketNumber: ticketNumber ?? `TK-${Date.now()}`,
        customerId,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discountPercent: item.discountPercent
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        taxBreakdown: totals.taxBreakdown,
        payment,
        exchangeRate: usdVesRate?.rate,
        exchangeRateUpdatedAt: usdVesRate?.updatedAt
      })
      if (payment.method === 'credit') await reloadCustomers()
      await reloadCashRegister()
    } catch (error: unknown) {
      showToast(`No se pudo completar la venta: ${salesErrorMessage(error)}`, 'error')
      return false
    }

    showToast(`¡Venta cobrada con éxito! ($${saleTotal.toFixed(2)})`)
    setCart([])
    return true
  }

  const handleSuspendSale = async (sale: SuspendedSale): Promise<boolean> => {
    try {
      await salesApi.suspend(sale)
      setSuspendedSales((prev) => [sale, ...prev.filter((item) => item.id !== sale.id)])
      setCart([])
      showToast('Venta pausada y guardada en espera', 'info')
      return true
    } catch (error: unknown) {
      showToast(`No se pudo pausar la venta: ${salesErrorMessage(error)}`, 'error')
      return false
    }
  }

  const handleResumeSale = async (sale: SuspendedSale): Promise<boolean> => {
    if (cart.length > 0) {
      showToast('Pausa o limpia la venta actual antes de recuperar otra.', 'error')
      return false
    }
    try {
      const items = await Promise.all(
        sale.items.map(async (item) => ({
          ...item,
          product: (await posProductsApi.getById(item.product.id)) ?? item.product
        }))
      )
      await salesApi.deleteSuspended(sale.id)
      setCart(items)
      setSuspendedSales((prev) => prev.filter((item) => item.id !== sale.id))
      showToast(`Venta "${sale.name}" recuperada a caja`)
      return true
    } catch (error: unknown) {
      showToast(`No se pudo recuperar la venta: ${salesErrorMessage(error)}`, 'error')
      return false
    }
  }

  const handleDeleteSuspendedSale = async (id: string): Promise<void> => {
    try {
      await salesApi.deleteSuspended(id)
      setSuspendedSales((prev) => prev.filter((sale) => sale.id !== id))
      showToast('Venta en espera descartada', 'info')
    } catch (error: unknown) {
      showToast(`No se pudo eliminar la venta en espera: ${salesErrorMessage(error)}`, 'error')
    }
  }

  const handleAddCustomer = async (
    customerData: Omit<
      Customer,
      'id' | 'currentDebt' | 'active' | 'deleted' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Customer> => {
    const newCustomer = await createCustomer(customerData)
    showToast(`Cliente "${newCustomer.name}" registrado`)
    return newCustomer
  }

  const handleCustomerPaymentReceived = (): void => {
    void reloadCashRegister()
    showToast('Abono de cliente registrado en el turno y la gaveta de caja.')
  }

  const handleOpenCashShift = async (input: OpenCashShiftInput): Promise<boolean> => {
    try {
      setCashRegister(await cashApi.openShift(input))
      setCashError(null)
      showToast(`Caja abierta con fondo de $${input.openingAmount.toFixed(2)}.`)
      return true
    } catch (error: unknown) {
      showToast(`No se pudo abrir la caja: ${cashErrorMessage(error)}`, 'error')
      return false
    }
  }

  const handleCloseShift = async (input: CloseCashShiftInput): Promise<boolean> => {
    try {
      setCashRegister(await cashApi.closeShift(input))
      setSuspendedSales([])
      showToast(`Caja cerrada. Efectivo contado: $${input.countedCash.toFixed(2)}.`)
      return true
    } catch (error: unknown) {
      showToast(`No se pudo cerrar la caja: ${cashErrorMessage(error)}`, 'error')
      return false
    }
  }

  const handleAddCashMovement = async (input: CreateCashMovementInput): Promise<boolean> => {
    try {
      setCashRegister(await cashApi.addMovement(input))
      showToast(
        `Movimiento ${input.type.toLowerCase()} registrado por $${input.amount.toFixed(2)}.`
      )
      return true
    } catch (error: unknown) {
      showToast(`No se pudo registrar el movimiento: ${cashErrorMessage(error)}`, 'error')
      return false
    }
  }

  const handleReturnSale = async (saleId: string): Promise<boolean> => {
    try {
      await cashApi.returnSale(saleId)
      await reloadCashRegister()
      await reloadKardex()
      await reloadCustomers()
      showToast(
        'Factura devuelta: se repuso el inventario y se registró el movimiento de caja/Kardex.'
      )
      return true
    } catch (error: unknown) {
      showToast(`No se pudo devolver la factura: ${cashErrorMessage(error)}`, 'error')
      return false
    }
  }

  // Cierre de sesión: limpia backend + estado local del operador.
  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      // logoutApi nunca lanza: si el canal IPC/SQLite no está listo, la sesión local se cierra igual.
      await logoutApi()
    } finally {
      setCart([])
      setSuspendedSales([])
      setCashRegister({ shift: null, shiftOptions: [], movements: [], tickets: [] })
      setCurrentUser(null)
      setIsLoggingOut(false)
      showToast(
        'Sesión cerrada correctamente. Vuelva a ingresar con su PIN o credenciales.',
        'info'
      )
    }
  }

  // Cambio de operador validado por PIN desde el candado del header (LOCK).
  const handleOperatorSwitch = (nextUser: User): void => {
    setCurrentUser(nextUser)
    setCashRegister({ shift: null, shiftOptions: [], movements: [], tickets: [] })
    setSuspendedSales([])
    setCashError(null)
    void reloadCashRegister()
    showToast(`Operador activo: ${nextUser.name}.`, 'success')
  }

  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={(user) => {
            setCurrentUser(user)
            void reloadCashRegister()
          }}
        />
        {toast && <ToastAlert key={toast.id} toast={toast} onDismiss={dismissToast} />}
      </>
    )
  }

  return (
    <DashboardLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      onOperatorSwitch={handleOperatorSwitch}
      cashShiftOpen={Boolean(cashRegister.activeShiftId)}
      isLoggingOut={isLoggingOut}
    >
      {/* Toast Alert Feedback */}
      {toast && <ToastAlert key={toast.id} toast={toast} onDismiss={dismissToast} />}
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
          exchangeRate={usdVesRate}
          exchangeRateLoading={isExchangeRateLoading}
          exchangeRateError={exchangeRateError}
          onRefreshExchangeRate={() => void refreshExchangeRate()}
          cashierName={currentUser.name}
          cashShiftOpen={Boolean(cashRegister.activeShiftId)}
          canOverrideNoStock={currentUser.permissions?.includes('CAN_OVERRIDE_NO_STOCK') ?? false}
          canApplyDiscount={currentUser.permissions?.includes('CAN_APPLY_DISCOUNT') ?? false}
        />
      )}

      {/* 2. MÓDULO DE INVENTARIO Y PRODUCTOS */}
      {activeTab === 'products' && canAccessTab(currentUser, 'products') && <ProductTable />}

      {/* 3. MÓDULO DE KARDEX (AUDITORÍA INMUTABLE) */}
      {activeTab === 'kardex' && canAccessTab(currentUser, 'kardex') && (
        <KardexView
          data={kardexData}
          query={kardexQuery}
          onQueryChange={setKardexQuery}
          isLoading={isKardexLoading}
          error={kardexError}
          onRefresh={() => void reloadKardex()}
          onExport={exportKardexMovements}
        />
      )}

      {/* 4. MÓDULO DE CAJA (CORTE DE TURNO) */}
      {activeTab === 'cash' && canAccessTab(currentUser, 'cash') && (
        <CashShiftView
          register={cashRegister}
          isLoading={isCashLoading}
          error={cashError}
          isAdmin={currentUser.role === 'ADMIN'}
          canReturnSales={currentUser.role === 'ADMIN' || currentUser.role === 'CASHIER'}
          canManageMovements={
            currentUser.permissions?.includes('CAN_MANUAL_CASH_MOVEMENTS') ?? false
          }
          onRefresh={() => void reloadCashRegister(cashRegister.shift?.id)}
          onSelectShift={(shiftId) => void reloadCashRegister(shiftId)}
          onOpenShift={handleOpenCashShift}
          onAddCashMovement={handleAddCashMovement}
          onCloseShift={handleCloseShift}
          onReturnSale={handleReturnSale}
        />
      )}

      {/* 5. MÓDULO DE CLIENTES (CRÉDITOS Y CUENTAS POR COBRAR) */}
      {activeTab === 'customers' && canAccessTab(currentUser, 'customers') && (
        <CustomersView
          canManageCustomers={currentUser.role === 'ADMIN'}
          canReceivePayments={currentUser.role === 'ADMIN' || currentUser.role === 'CASHIER'}
          isCashShiftOpen={Boolean(cashRegister.activeShiftId)}
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
