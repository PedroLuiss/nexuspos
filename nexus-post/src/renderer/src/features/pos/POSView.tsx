import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Product,
  PaymentDetails,
  Customer
} from '../../shared/types/domain'
import SaleModal from './components/SaleModal'
import SplitPaymentModal from './components/SplitPaymentModal'
import SuspendedSalesModal from './components/SuspendedSalesModal'
import TicketPreviewModal from './components/TicketPreviewModal'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Layers,
  Check,
  RotateCcw,
  Receipt,
  ShoppingCart,
  Clock,
  AlertCircle,
  Pause,
  Zap,
  List,
  User,
  UserPlus,
  UserCheck,
  X
} from '../../shared/icons/Icons'
import { POSViewProps } from './types'

export const POSView: React.FC<POSViewProps> = ({
  products,
  cart,
  suspendedSales,
  customers = [],
  onAddCustomer,
  onAddToCart,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveFromCart,
  onClearCart,
  onCompleteSale,
  onSuspendSale,
  onResumeSale,
  onDeleteSuspendedSale
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchMatches, setSearchMatches] = useState<Product[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // =========================================================
  // CUSTOMER ASSIGNMENT STATE
  // =========================================================
  const [assignCustomer, setAssignCustomer] = useState(false)
  const [customerCedulaInput, setCustomerCedulaInput] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false)
  const customerCedulaRef = useRef<HTMLInputElement>(null)

  // Form state for creating a new customer modal
  const [newCustTaxId, setNewCustTaxId] = useState('')
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustAddress, setNewCustAddress] = useState('')
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(5000)

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [lastPaymentDetails, setLastPaymentDetails] = useState<PaymentDetails | undefined>(undefined)

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    return acc + item.product.salePrice * item.quantity
  }, 0)

  const discountTotal = cart.reduce((acc, item) => {
    const rawTotal = item.product.salePrice * item.quantity
    return acc + rawTotal * (item.discountPercent / 100)
  }, 0)

  const taxableAmount = cart
    .filter((item) => item.product.hasTax)
    .reduce((acc, item) => {
      return acc + item.product.salePrice * item.quantity * (1 - item.discountPercent / 100)
    }, 0)

  const taxTotal = taxableAmount * 0.16
  const finalTotal = subtotal - discountTotal + taxTotal
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  // Detección de déficit de stock
  const hasStockDeficit = cart.some((item) => item.quantity > item.product.stock)

  // Live product search
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchMatches([])
      setShowSearchResults(false)
      return
    }

    const query = searchInput.toLowerCase().trim()
    const matches = products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query))
    )
    setSearchMatches(matches.slice(0, 6))
    setShowSearchResults(matches.length > 0)
  }, [searchInput, products])

  // Customer search by Cédula / RFC / Name
  const customerMatches = useMemo(() => {
    const query = customerCedulaInput.trim().toLowerCase()
    if (!query) return []
    return customers.filter(
      (c) =>
        c.taxId.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        (c.phone && c.phone.toLowerCase().includes(query))
    )
  }, [customerCedulaInput, customers])

  // Handle enter key in product search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const query = searchInput.trim()
      if (!query) return

      const exactMatch = products.find((p) => p.code === query && p.active)
      if (exactMatch) {
        onAddToCart(exactMatch, 1)
        setSearchInput('')
        setShowSearchResults(false)
        return
      }

      if (searchMatches.length > 0) {
        onAddToCart(searchMatches[0], 1)
        setSearchInput('')
        setShowSearchResults(false)
      }
    }
  }

  // Handle enter key in customer cédula search
  const handleCustomerCedulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const query = customerCedulaInput.trim().toLowerCase()
      if (!query) return

      // Exact match on cédula / taxId
      const exactMatch = customers.find((c) => c.taxId.toLowerCase() === query)
      if (exactMatch) {
        setSelectedCustomer(exactMatch)
        setShowCustomerDropdown(false)
        setCustomerCedulaInput('')
        return
      }

      // First match
      if (customerMatches.length > 0) {
        setSelectedCustomer(customerMatches[0])
        setShowCustomerDropdown(false)
        setCustomerCedulaInput('')
        return
      }

      // If not found: open create customer modal with prefilled cédula
      setNewCustTaxId(customerCedulaInput.trim())
      setIsCreateCustomerModalOpen(true)
    }
  }

  // Open create customer modal with current input
  const handleOpenCreateCustomerModal = (): void => {
    setNewCustTaxId(customerCedulaInput.trim())
    setIsCreateCustomerModalOpen(true)
  }

  // Save new customer and associate directly to invoice
  const handleSaveNewCustomer = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!newCustName.trim()) return

    const generatedCode = 'CLI-' + Math.floor(100 + Math.random() * 900)
    const customerPayload = {
      code: generatedCode,
      name: newCustName.trim(),
      taxId: newCustTaxId.trim() || 'XAXX010101000',
      phone: newCustPhone.trim(),
      email: newCustEmail.trim(),
      address: newCustAddress.trim(),
      creditLimit: Number(newCustCreditLimit) || 5000
    }

    let created: Customer
    if (onAddCustomer) {
      created = onAddCustomer(customerPayload)
    } else {
      created = {
        ...customerPayload,
        id: `cust-${Date.now()}`,
        currentDebt: 0,
        debts: [],
        payments: []
      }
    }

    setSelectedCustomer(created)
    setAssignCustomer(true)
    setCustomerCedulaInput('')
    setShowCustomerDropdown(false)
    setIsCreateCustomerModalOpen(false)

    // Reset fields
    setNewCustName('')
    setNewCustPhone('')
    setNewCustEmail('')
    setNewCustAddress('')
  }

  // Quick cash checkout [ALT+Q]
  const handleQuickCash = (): void => {
    if (cart.length === 0) return
    const details: PaymentDetails = {
      method: 'cash',
      amountPaid: finalTotal,
      change: 0
    }
    setLastPaymentDetails(details)
    onCompleteSale(details)
  }

  // Global hotkeys listener for keyboard-first POS flow
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent): void => {
      // If modal is active, let modal handle keys
      if (
        isSaleModalOpen ||
        isSplitModalOpen ||
        isSuspendedModalOpen ||
        isPreviewModalOpen ||
        isCreateCustomerModalOpen
      ) {
        return
      }

      // [F2]: Focus barcode / product search
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      // [F12]: Open Checkout modal
      if (e.key === 'F12') {
        e.preventDefault()
        if (cart.length > 0) setIsSaleModalOpen(true)
        return
      }

      // [F6]: Fast Cash checkout
      if (e.key === 'F6') {
        e.preventDefault()
        if (cart.length > 0) setIsSaleModalOpen(true)
        return
      }

      // [F7]: Fast Card checkout
      if (e.key === 'F7') {
        e.preventDefault()
        if (cart.length > 0) setIsSaleModalOpen(true)
        return
      }

      // [F8]: Split payment modal
      if (e.key === 'F8') {
        e.preventDefault()
        if (cart.length > 0) setIsSplitModalOpen(true)
        return
      }

      // [ALT+K]: Toggle and focus customer cédula input
      if (e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setAssignCustomer(true)
        setTimeout(() => {
          customerCedulaRef.current?.focus()
          customerCedulaRef.current?.select()
        }, 50)
        return
      }

      // [ALT+Q]: Quick cash payment
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault()
        handleQuickCash()
        return
      }

      // [ALT+P]: Pause / suspend sale
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        if (cart.length > 0) onSuspendSale()
        return
      }

      // [ALT+L]: Toggle search list
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        setShowSearchResults((prev) => !prev)
        return
      }

      // [ALT+E]: Open suspended sales
      if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        setIsSuspendedModalOpen(true)
        return
      }

      // [ALT+T]: View ticket receipt
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault()
        if (cart.length > 0) setIsPreviewModalOpen(true)
        return
      }

      // [Escape]: Clear cart / Close dropdowns
      if (e.key === 'Escape') {
        if (showSearchResults) {
          setShowSearchResults(false)
        } else if (showCustomerDropdown) {
          setShowCustomerDropdown(false)
        } else if (cart.length > 0) {
          onClearCart()
        }
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [
    cart,
    finalTotal,
    isSaleModalOpen,
    isSplitModalOpen,
    isSuspendedModalOpen,
    isPreviewModalOpen,
    isCreateCustomerModalOpen,
    showSearchResults,
    showCustomerDropdown,
    onSuspendSale,
    onClearCart
  ])

  // Split payment confirmation
  const handleConfirmSplit = (cashAmount: number, cardAmount: number): void => {
    const details: PaymentDetails = {
      method: 'mixed',
      amountPaid: finalTotal,
      change: 0,
      cashAmount,
      cardAmount
    }
    setLastPaymentDetails(details)
    onCompleteSale(details)
    setIsSplitModalOpen(false)
  }

  // Active customer display name for ticket
  const activeCustomerDisplayName =
    assignCustomer && selectedCustomer
      ? `${selectedCustomer.name} (${selectedCustomer.taxId})`
      : '000 - Consumidor Final'

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F3F3F3]">
      {/* ========================================================= */}
      {/* PRIMARY LEFT WORKSPACE (62% width): Búsqueda + Ticket Grid */}
      {/* ========================================================= */}
      <div className="flex-[62] flex flex-col p-3 pr-1.5 overflow-hidden space-y-2.5">
        {/* Top Command Bar & Search (Fluent Box) */}
        <div className="relative bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]"
              />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                placeholder="Escanear código de barras o buscar producto [F2]..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-24 py-2 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] font-medium text-[#1B1B1B] placeholder:text-[#717783]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 kbd-badge">
                ENTER
              </span>
            </div>

            {/* Buscar en Lista [ALT+L] */}
            <button
              onClick={() => setShowSearchResults(!showSearchResults)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer"
            >
              <List size={14} className="text-[#0067C0]" />
              <span>Lista</span>
              <span className="kbd-badge">
                ALT+L
              </span>
            </button>

            {/* Pausar Venta [ALT+P] */}
            <button
              onClick={onSuspendSale}
              disabled={cart.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-amber-50 disabled:opacity-40 border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
            >
              <Pause size={13} className="text-amber-600" />
              <span>Pausar</span>
              <span className="kbd-badge">
                ALT+P
              </span>
            </button>

            {/* Tickets en Espera [ALT+E] */}
            <button
              onClick={() => setIsSuspendedModalOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
            >
              <Clock size={13} className="text-[#5C5C5C]" />
              <span>Espera</span>
              {suspendedSales.length > 0 && (
                <span className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {suspendedSales.length}
                </span>
              )}
              <span className="kbd-badge">
                ALT+E
              </span>
            </button>
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-[#D1D1D1] rounded-[4px] shadow-lg max-h-60 overflow-y-auto divide-y divide-[#E5E5E5]">
              {searchMatches.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onAddToCart(prod, 1)
                    setSearchInput('')
                    setShowSearchResults(false)
                  }}
                  className="flex items-center justify-between p-2.5 hover:bg-[#EBF0F5] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[#5C5C5C] bg-[#F3F3F3] px-1.5 py-0.5 rounded-[2px] border border-[#E5E5E5]">
                      {prod.code}
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-[#1B1B1B]">{prod.name}</div>
                      <div className="text-[11px] text-[#717783]">{prod.category} | Stock: {prod.stock}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-[#0067C0]">
                      ${prod.salePrice.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Click para agregar</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Table: Sales Ticket (Stitch Design Specification) */}
        <div className="flex-1 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header: #F9F9F9 background, uppercase 12px semi-bold text */}
              <thead className="sticky top-0 z-10 bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold text-[11px] tracking-wider uppercase select-none shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 w-28">CÓDIGO</th>
                  <th className="py-2.5 px-3">DESCRIPCIÓN</th>
                  <th className="py-2.5 px-3 text-center w-32">CANTIDAD</th>
                  <th className="py-2.5 px-3 text-right w-24">P. UNITARIO</th>
                  <th className="py-2.5 px-3 text-center w-24">DESCUENTO</th>
                  <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
                  <th className="py-2.5 px-3 text-center w-10"></th>
                </tr>
              </thead>

              {/* Rows: Alternating #FFFFFF and #FDFDFD, row height 40px, cell padding 8px 12px */}
              <tbody className="divide-y divide-[#E5E5E5]">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-[#717783]">
                      <ShoppingCart size={42} className="mx-auto mb-2 text-[#D1D1D1] stroke-1" />
                      <p className="text-sm font-semibold text-[#1B1B1B]">Ticket de venta vacío</p>
                      <p className="text-xs text-[#717783] mt-0.5">
                        Escanea un código de barras o presiona [F2] / [ALT+L] para agregar productos al ticket
                      </p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const rawLineTotal = item.product.salePrice * item.quantity
                    const discountedTotal = rawLineTotal * (1 - item.discountPercent / 100)
                    const isSelected = selectedCartItemId === item.product.id
                    const isOverStock = item.quantity > item.product.stock

                    return (
                      <tr
                        key={item.product.id}
                        onClick={() => setSelectedCartItemId(item.product.id)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]'
                            : isOverStock
                              ? 'bg-red-50/50 hover:bg-red-50'
                              : 'even:bg-[#FDFDFD] hover:bg-[#F9F9F9]'
                        }`}
                        style={{ height: '40px' }}
                      >
                        {/* CÓDIGO */}
                        <td className="py-2 px-3 font-mono text-xs text-[#5C5C5C] font-semibold">
                          {item.product.code}
                        </td>

                        {/* DESCRIPCIÓN */}
                        <td className="py-2 px-3">
                          <div className="font-semibold text-xs text-[#1B1B1B]">{item.product.name}</div>
                          {isOverStock && (
                            <span className="text-[10px] text-[#C42B1C] font-bold flex items-center gap-1 mt-0.5">
                              <AlertCircle size={11} /> Stock insuficiente (Solo hay {item.product.stock})
                            </span>
                          )}
                        </td>

                        {/* CANTIDAD (Steppers) */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center border border-[#D1D1D1] rounded-[2px] bg-white overflow-hidden shadow-xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                              }}
                              className="px-2 py-0.5 text-[#5C5C5C] hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                onUpdateQuantity(
                                  item.product.id,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-10 text-center text-xs font-bold font-mono text-[#1B1B1B] border-x border-[#E5E5E5] py-0.5"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onUpdateQuantity(item.product.id, item.quantity + 1)
                              }}
                              className="px-2 py-0.5 text-[#5C5C5C] hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </td>

                        {/* P. UNITARIO */}
                        <td className="py-2 px-3 text-right font-mono font-medium text-xs text-[#1B1B1B]">
                          ${item.product.salePrice.toFixed(2)}
                        </td>

                        {/* DESCUENTO */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent || 0}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                onUpdateDiscount(
                                  item.product.id,
                                  Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                                )
                              }
                              className="w-10 text-center text-[11px] font-mono bg-[#F9F9F9] border border-[#D1D1D1] rounded-[2px] py-0.5"
                            />
                            <span className="text-[#717783] text-[11px]">%</span>
                          </div>
                        </td>

                        {/* TOTAL */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-xs text-[#1B1B1B]">
                          ${discountedTotal.toFixed(2)}
                        </td>

                        {/* ACCIONES */}
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveFromCart(item.product.id)
                            }}
                            title="Eliminar ítem"
                            className="p-1 text-[#717783] hover:text-[#C42B1C] rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Subfooter: Líneas, Unidades y Limpiar Venta */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#F9F9F9] border-t border-[#E5E5E5] text-xs text-[#5C5C5C]">
            <div className="flex items-center gap-3">
              <span>
                Líneas: <strong className="text-[#1B1B1B]">{cart.length}</strong>
              </span>
              <span>•</span>
              <span>
                Unidades: <strong className="text-[#1B1B1B]">{totalItemCount}</strong>
              </span>
            </div>

            {hasStockDeficit && (
              <span className="text-[#C42B1C] font-bold flex items-center gap-1 text-[11px]">
                <AlertCircle size={13} /> Alerta: Existen productos con stock insuficiente
              </span>
            )}

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[#C42B1C] hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              >
                <RotateCcw size={12} /> Limpiar Venta [ESC]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT ACTION PANE (38% width): Cliente, Resumen & Cobro   */}
      {/* ========================================================= */}
      <div className="flex-[38] flex flex-col p-3 pl-1.5 overflow-hidden space-y-2.5">
        {/* ========================================================= */}
        {/* CLIENTE ASIGNADO / FACTURACIÓN A CLIENTE                  */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-2.5">
          {/* Header con Check de Facturar a Cliente */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5] text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={assignCustomer}
                onChange={(e) => {
                  setAssignCustomer(e.target.checked)
                  if (!e.target.checked) {
                    setSelectedCustomer(null)
                    setCustomerCedulaInput('')
                    setShowCustomerDropdown(false)
                  } else {
                    setTimeout(() => {
                      customerCedulaRef.current?.focus()
                    }, 50)
                  }
                }}
                className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1] focus:ring-[#0067C0]"
              />
              <span className="font-bold text-[#1B1B1B]">
                Asociar cliente a la factura
              </span>
            </label>

            <span className="text-[10px] font-mono text-[#717783] bg-[#F3F3F3] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
              [ALT+K]
            </span>
          </div>

          {/* Estado: Sin asociar (Consumidor Final) */}
          {!assignCustomer && (
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F3F3F3] text-[#5C5C5C] flex items-center justify-center font-bold text-xs border border-[#E5E5E5]">
                  <User size={14} />
                </div>
                <div>
                  <span className="block text-[10px] text-[#717783] uppercase tracking-wider font-semibold">
                    Destinatario del Ticket
                  </span>
                  <span className="font-semibold text-xs text-[#1B1B1B]">
                    000 - Consumidor Final / Público General
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setAssignCustomer(true)
                  setTimeout(() => customerCedulaRef.current?.focus(), 50)
                }}
                className="px-2 py-1 text-[11px] font-semibold text-[#0067C0] bg-[#0067C0]/10 hover:bg-[#0067C0] hover:text-white rounded-[2px] transition-colors cursor-pointer border border-[#0067C0]/20"
              >
                + Asignar
              </button>
            </div>
          )}

          {/* Estado: Checkbox Marcado */}
          {assignCustomer && (
            <div className="space-y-2 pt-0.5">
              {/* Si YA hay un cliente seleccionado */}
              {selectedCustomer ? (
                <div className="p-2.5 bg-[#EBF0F5] border border-[#0067C0]/30 rounded-[4px] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0067C0] text-white flex items-center justify-center font-bold shadow-xs">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#1B1B1B] flex items-center gap-1.5">
                        <span>{selectedCustomer.name}</span>
                        {selectedCustomer.currentDebt > 0 ? (
                          <span className="text-[10px] font-bold text-[#C42B1C] bg-red-50 border border-red-200 px-1 py-0.2 rounded">
                            Deuda: ${selectedCustomer.currentDebt.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#107C41] bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                            Al Día
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#5C5C5C] flex items-center gap-2 mt-0.5">
                        <span>Cédula/RFC: <strong>{selectedCustomer.taxId}</strong></span>
                        {selectedCustomer.phone && <span>• Tel: {selectedCustomer.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedCustomer(null)
                        setCustomerCedulaInput('')
                        setTimeout(() => customerCedulaRef.current?.focus(), 50)
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-[#0067C0] hover:bg-white rounded-[2px] transition-colors cursor-pointer border border-[#0067C0]/30"
                      title="Cambiar cliente"
                    >
                      Cambiar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(null)
                        setAssignCustomer(false)
                        setCustomerCedulaInput('')
                      }}
                      className="p-1 text-[#717783] hover:text-[#C42B1C] rounded transition-colors cursor-pointer"
                      title="Quitar cliente y volver a Consumidor Final"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Si NO hay cliente seleccionado: Buscador por Cédula */
                <div className="relative">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]"
                    />
                    <input
                      ref={customerCedulaRef}
                      type="text"
                      placeholder="Ingresar cédula o RFC del cliente [ENTER]..."
                      value={customerCedulaInput}
                      onChange={(e) => {
                        setCustomerCedulaInput(e.target.value)
                        setShowCustomerDropdown(true)
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onKeyDown={handleCustomerCedulaKeyDown}
                      className="w-full pl-8 pr-16 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] text-[#1B1B1B] font-mono"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#717783] bg-[#EBEBEB] px-1 rounded border border-[#D1D1D1]">
                      ENTER
                    </span>
                  </div>

                  {/* Resultados y Opción de Crear Nuevo Cliente */}
                  {showCustomerDropdown && customerCedulaInput.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-[#D1D1D1] rounded-[4px] shadow-lg max-h-52 overflow-y-auto divide-y divide-[#E5E5E5]">
                      {customerMatches.length > 0 ? (
                        customerMatches.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomer(c)
                              setShowCustomerDropdown(false)
                              setCustomerCedulaInput('')
                            }}
                            className="p-2.5 hover:bg-[#EBF0F5] cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#1B1B1B]">{c.name}</div>
                              <div className="text-[11px] font-mono text-[#5C5C5C]">
                                Cédula/RFC: <strong className="text-[#0067C0]">{c.taxId}</strong> • {c.code}
                              </div>
                            </div>
                            <button className="px-2 py-0.5 bg-[#0067C0] text-white rounded text-[10px] font-bold">
                              Asociar
                            </button>
                          </div>
                        ))
                      ) : (
                        /* Si no se encuentra: Mensaje y botón para Crear Nuevo */
                        <div className="p-3 text-center bg-amber-50/50 space-y-2">
                          <div className="text-xs text-[#5C5C5C]">
                            No existe cliente con cédula:{' '}
                            <strong className="font-mono text-[#1B1B1B]">
                              "{customerCedulaInput.trim()}"
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenCreateCustomerModal}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#0067C0] hover:bg-[#0078D4] text-white font-bold text-xs rounded-[4px] shadow-xs transition-colors cursor-pointer"
                          >
                            <UserPlus size={14} />
                            <span>+ Registrar Nuevo Cliente</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón directo para registrar nuevo si no se encuentra o desea crearlo manualmente */}
                  {customerCedulaInput.trim().length > 0 && customerMatches.length === 0 && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={handleOpenCreateCustomerModal}
                        className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 bg-white hover:bg-blue-50 text-[#0067C0] border border-[#0067C0]/30 font-semibold text-xs rounded-[4px] transition-colors cursor-pointer"
                      >
                        <UserPlus size={13} />
                        <span>Crear cliente con cédula "{customerCedulaInput.trim()}"</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Subtotal Breakdown & Prominent Balance Card */}
        <div className="flex-1 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C] border-b border-[#E5E5E5] pb-2 mb-3">
              Resumen de Transacción
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#5C5C5C]">
                <span>Subtotal ({totalItemCount} artículos):</span>
                <span className="font-mono font-medium text-[#1B1B1B]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-[#107C41] font-semibold">
                  <span>Descuentos aplicados:</span>
                  <span className="font-mono">-${discountTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#5C5C5C]">
                <span>IVA Trasladado (16%):</span>
                <span className="font-mono font-medium text-[#1B1B1B]">
                  ${taxTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Prominent Balance Card (Stitch: currency-total in #1B1B1B / Emerald state) */}
            <div className="mt-4 p-4 bg-[#F9F9F9] border border-[#E5E5E5] rounded-[6px] text-center">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#717783]">
                Total a Pagar
              </span>
              <div className="text-4xl font-extrabold font-mono text-[#1B1B1B] mt-1 tracking-tight">
                ${finalTotal.toFixed(2)}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#107C41]"></span>
                <span>BALANCE PENDIENTE DE COBRO</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Section (Stitch Style: Emerald Checkout Action Button + Tender Keys) */}
          <div className="space-y-2.5 pt-3 border-t border-[#E5E5E5]">
            {/* Primary Checkout Button: Emerald Green (#107C41) with [F12] badge */}
            <button
              onClick={() => setIsSaleModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-between py-3.5 px-4 bg-[#107C41] hover:bg-[#0F7B0F] active:bg-[#005228] disabled:bg-slate-300 text-white font-bold text-sm rounded-[4px] shadow-sm transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Check size={18} />
                <span>COBRAR TICKET</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">${finalTotal.toFixed(2)}</span>
                <span className="kbd-badge bg-[#005228]/50 text-white border-emerald-700/50">
                  F12
                </span>
              </div>
            </button>

            {/* Fast Tender Keys (Efectivo, Tarjeta, Mixto) */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* Efectivo F6 */}
              <button
                onClick={() => setIsSaleModalOpen(true)}
                disabled={cart.length === 0}
                className="flex flex-col items-center justify-center py-2 px-1 bg-white hover:bg-[#F9F9F9] disabled:opacity-40 text-[#1B1B1B] rounded-[4px] border border-[#D1D1D1] shadow-xs transition-colors text-xs font-semibold cursor-pointer"
              >
                <Banknote size={16} className="text-[#107C41] mb-0.5" />
                <span>Efectivo</span>
                <span className="kbd-badge mt-0.5 text-[10px]">
                  F6
                </span>
              </button>

              {/* Tarjeta F7 */}
              <button
                onClick={() => setIsSaleModalOpen(true)}
                disabled={cart.length === 0}
                className="flex flex-col items-center justify-center py-2 px-1 bg-white hover:bg-[#F9F9F9] disabled:opacity-40 text-[#1B1B1B] rounded-[4px] border border-[#D1D1D1] shadow-xs transition-colors text-xs font-semibold cursor-pointer"
              >
                <CreditCard size={16} className="text-[#0067C0] mb-0.5" />
                <span>Tarjeta</span>
                <span className="kbd-badge mt-0.5 text-[10px]">
                  F7
                </span>
              </button>

              {/* Pago Mixto F8 */}
              <button
                onClick={() => setIsSplitModalOpen(true)}
                disabled={cart.length === 0}
                className="flex flex-col items-center justify-center py-2 px-1 bg-white hover:bg-[#F9F9F9] disabled:opacity-40 text-[#1B1B1B] rounded-[4px] border border-[#D1D1D1] shadow-xs transition-colors text-xs font-semibold cursor-pointer"
              >
                <Layers size={16} className="text-purple-700 mb-0.5" />
                <span>Mixto</span>
                <span className="kbd-badge mt-0.5 text-[10px]">
                  F8
                </span>
              </button>
            </div>

            {/* Auxiliary actions row: Cobro Rápido [ALT+Q] & Vista Previa Ticket */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
              <button
                onClick={handleQuickCash}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#107C41]/10 hover:bg-[#107C41]/20 active:bg-[#107C41]/30 disabled:opacity-40 text-[#107C41] font-bold border border-[#107C41]/30 rounded-[4px] transition-colors cursor-pointer"
              >
                <Zap size={14} className="text-[#107C41]" />
                <span>Cobro Rápido</span>
                <span className="kbd-badge text-[#107C41] bg-[#107C41]/15 border-[#107C41]/30">
                  ALT+Q
                </span>
              </button>

              <button
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-[#F9F9F9] disabled:opacity-40 text-[#1B1B1B] font-semibold border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
              >
                <Receipt size={14} className="text-[#0067C0]" />
                <span>Ver Ticket</span>
                <span className="kbd-badge">
                  ALT+T
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Modal (F12) */}
      <SaleModal
        isOpen={isSaleModalOpen}
        total={finalTotal}
        subtotal={subtotal}
        tax={taxTotal}
        discount={discountTotal}
        items={cart}
        onClose={() => setIsSaleModalOpen(false)}
        onConfirmSale={(details) => {
          setLastPaymentDetails(details)
          onCompleteSale(details)
          setIsSaleModalOpen(false)
        }}
      />

      {/* Split Payment Modal (F8) */}
      <SplitPaymentModal
        isOpen={isSplitModalOpen}
        total={finalTotal}
        onClose={() => setIsSplitModalOpen(false)}
        onConfirmSplit={handleConfirmSplit}
      />

      {/* Suspended Sales Modal */}
      <SuspendedSalesModal
        isOpen={isSuspendedModalOpen}
        suspendedSales={suspendedSales}
        onClose={() => setIsSuspendedModalOpen(false)}
        onResumeSale={(sale) => {
          onResumeSale(sale)
          setIsSuspendedModalOpen(false)
        }}
        onDeleteSuspendedSale={onDeleteSuspendedSale}
      />

      {/* 80mm Thermal Receipt Preview Modal */}
      <TicketPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        items={cart}
        subtotal={subtotal}
        tax={taxTotal}
        discount={discountTotal}
        total={finalTotal}
        payment={lastPaymentDetails}
        ticketNumber="TK-00824"
        cashierName="Carlos Morales"
        customerName={activeCustomerDisplayName}
      />

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR NUEVO CLIENTE (ASOCIAR A FACTURA)        */}
      {/* ========================================================= */}
      {isCreateCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-lg bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            {/* Modal Header */}
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0]">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                    Registrar Nuevo Cliente
                  </h3>
                  <p className="text-[11px] text-[#5C5C5C]">
                    El cliente será guardado y asociado automáticamente a la factura actual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCustomerModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewCustomer}>
              <div className="p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1B1B1B] mb-1">
                      Cédula / RFC / ID Fiscal <span className="text-[#C42B1C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustTaxId}
                      onChange={(e) => setNewCustTaxId(e.target.value)}
                      placeholder="Ej. 1029384756"
                      className="w-full px-2.5 py-1.5 bg-[#F9F9F9] font-mono border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-bold focus:bg-white focus:border-[#0067C0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1B1B1B] mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 55-1234-5678"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">
                    Nombre Completo o Razón Social <span className="text-[#C42B1C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej. María Elena Fernández"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-semibold focus:border-[#0067C0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1B1B1B] mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@correo.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1B1B1B] mb-1">
                      Límite de Crédito ($)
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={newCustCreditLimit}
                      onChange={(e) => setNewCustCreditLimit(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white font-mono font-bold border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">
                    Dirección Fiscal / Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, número, colonia, ciudad..."
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCustomerModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] cursor-pointer"
                >
                  Cancelar [ESC]
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs cursor-pointer"
                >
                  <Check size={14} />
                  <span>Guardar y Asociar a Factura</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default POSView
