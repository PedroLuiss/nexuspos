import React, { useState, useMemo } from 'react'
import type {
  Customer,
  CustomerPayment,
  CustomerAccountSummary
} from '@shared/contracts'
import {
  Users,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  X
} from '../../shared/icons/Icons'
import { useCustomers } from './hooks/useCustomers'

interface CustomersViewProps {
  onPaymentReceived?: (payment: CustomerPayment) => void
}

type CustomerAccountView = Customer & Pick<CustomerAccountSummary, 'debts' | 'payments'>

export const CustomersView: React.FC<CustomersViewProps> = ({
  onPaymentReceived
}) => {
  const {
    customers,
    isLoading,
    error,
    reload,
    createCustomer,
    deleteCustomer,
    toggleStatus,
    getAccountSummary,
    recordPayment
  } = useCustomers(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEBTORS' | 'UP_TO_DATE'>('ALL')
  const [showDeactivated, setShowDeactivated] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccountView | null>(null)
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentConcept, setPaymentConcept] = useState('Abono a cuenta general')

  // New customer form state
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newTaxId, setNewTaxId] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newCreditLimit, setNewCreditLimit] = useState<number>(5000)

  // Filters
  const filteredCustomers = useMemo(() => {
    const listedCustomers = customers.filter((customer) =>
      showDeactivated ? !customer.active : customer.active
    )
    return listedCustomers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxId.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'DEBTORS'
            ? c.currentDebt > 0
            : c.currentDebt === 0

      return matchSearch && matchStatus
    })
  }, [customers, searchTerm, statusFilter, showDeactivated])

  const activeCustomers = customers.filter((customer) => customer.active)
  const deactivatedCount = customers.filter((customer) => !customer.active).length
  const totalDebts = activeCustomers.reduce((acc, c) => acc + c.currentDebt, 0)
  const totalDebtorsCount = activeCustomers.filter((c) => c.currentDebt > 0).length

  const handleOpenDebtDetails = async (customer: Customer): Promise<void> => {
    setSelectedCustomer({ ...customer, debts: [], payments: [] })
    try {
      const summary = await getAccountSummary(customer.id)
      if (summary) {
        // El modal usa selectedCustomer.debts y payments, que ya vienen del summary
        // Pero selectedCustomer es el customer original, no el del summary con deudas
        // Necesitamos enriquecer el customer con deudas y pagos
        setSelectedCustomer({
          ...customer,
          debts: summary.debts,
          payments: summary.payments
        })
      }
    } catch {
      // Ignorar errores al cargar detalles
    }
    setIsDebtModalOpen(true)
  }

  const handleOpenPayment = (customer: Customer): void => {
    setSelectedCustomer({ ...customer, debts: [], payments: [] })
    setPaymentAmount(customer.currentDebt > 0 ? customer.currentDebt : 0)
    setIsPaymentModalOpen(true)
  }

  const handleSubmitPayment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedCustomer || paymentAmount <= 0) return

    try {
      const payment = await recordPayment({
        customerId: selectedCustomer.id,
        amount: paymentAmount,
        concept: paymentConcept
      })
      onPaymentReceived?.(payment)
      setIsPaymentModalOpen(false)
      setPaymentAmount(0)
      setPaymentConcept('Abono a cuenta general')
      await reload()
    } catch {
      // El error ya se muestra via el hook
    }
  }

  const handleSubmitNewCustomer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!newName.trim()) return

    try {
      await createCustomer({
        code: newCode,
        name: newName.trim(),
        taxId: newTaxId.trim() || 'XAXX010101000',
        phone: newPhone.trim(),
        email: newEmail.trim(),
        address: newAddress.trim(),
        creditLimit: Number(newCreditLimit)
      })
      setIsNewCustomerModalOpen(false)
      setNewName('')
      setNewPhone('')
      setNewTaxId('')
      setNewEmail('')
      setNewAddress('')
      setNewCreditLimit(5000)
      setNewCode('CLI-' + Math.floor(100 + Math.random() * 900))
      await reload()
    } catch {
      // El error ya se muestra via el hook
    }
  }

  const handleToggleStatus = async (customer: Customer): Promise<void> => {
    try {
      await toggleStatus(customer.id)
      await reload({ includeInactive: true })
    } catch {
      // El error ya se muestra via el hook
    }
  }

  const handleShowDeactivated = async (): Promise<void> => {
    const loaded = await reload({ includeInactive: true })
    if (loaded) {
      setShowDeactivated(true)
    }
  }

  const handleDeleteCustomer = async (customer: Customer): Promise<void> => {
    if (!confirm(`¿Está seguro de eliminar al cliente "${customer.name}"?`)) return
    try {
      await deleteCustomer(customer.id)
      await reload()
    } catch {
      // El error ya se muestra via el hook
    }
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 bg-[#F3F3F3]">
      {/* Error feedback */}
      {error && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-semibold border bg-red-50 border-red-200 text-[#C42B1C]"
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4 text-xs text-[#5C5C5C]">
          Cargando clientes…
        </div>
      )}

      {!isLoading && (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="text-[#5C5C5C] text-xs font-semibold uppercase tracking-wider">
                Clientes Registrados
              </div>
              <div className="text-2xl font-bold font-mono text-[#1B1B1B] mt-1">
                {activeCustomers.length}
              </div>
              <div className="text-[11px] text-[#717783] mt-0.5">Padrón activo de compradores</div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="text-[#C42B1C] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={14} />
                <span>Cuentas por Cobrar</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#C42B1C] mt-1">
                ${totalDebts.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#717783] mt-0.5">Saldo pendiente de liquidar</div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="text-amber-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock size={14} />
                <span>Con Deuda Activa</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {totalDebtorsCount} de {activeCustomers.length}
              </div>
              <div className="text-[11px] text-[#717783] mt-0.5">Líneas de crédito en uso</div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="text-[#107C41] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>Clientes al Día</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#107C41] mt-1">
                {activeCustomers.length - totalDebtorsCount}
              </div>
              <div className="text-[11px] text-[#717783] mt-0.5">Sin saldo pendiente</div>
            </div>
          </div>

          {/* Toolbar & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="relative flex-1 min-w-[280px] max-w-sm">
              <Search
                size={15}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, código, RFC o teléfono [F5]..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] text-[#1B1B1B]"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#F3F3F3] p-0.5 rounded-[4px] border border-[#E5E5E5] text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-[#0067C0] shadow-xs'
                      : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
                  }`}
                >
                  Todos ({activeCustomers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('DEBTORS')}
                  className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'DEBTORS'
                      ? 'bg-white text-[#C42B1C] shadow-xs'
                      : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
                  }`}
                >
                  Con Deuda ({totalDebtorsCount})
                </button>
                <button
                  onClick={() => setStatusFilter('UP_TO_DATE')}
                  className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'UP_TO_DATE'
                      ? 'bg-white text-[#107C41] shadow-xs'
                      : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
                  }`}
                >
                  Al Día
                </button>
              </div>

              <button
                onClick={() => {
                  if (showDeactivated) {
                    setShowDeactivated(false)
                  } else {
                    void handleShowDeactivated()
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5C5C5C] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
              >
                {showDeactivated
                  ? `Volver a activos (${activeCustomers.length})`
                  : `Clientes desactivados${deactivatedCount > 0 ? ` (${deactivatedCount})` : ''}`}
              </button>

              {!showDeactivated && (
                <button
                  onClick={() => {
                    setNewCode('CLI-' + Math.floor(100 + Math.random() * 900))
                    setNewEmail('')
                    setIsNewCustomerModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Nuevo Cliente</span>
                  <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.2 rounded text-white">
                    [ALT+C]
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Dense Desktop Customers Table */}
          <div className="flex-1 overflow-hidden bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2 text-xs">
              <strong className="text-[#1B1B1B]">
                {showDeactivated ? 'Clientes desactivados' : 'Clientes activos'}
              </strong>
              {showDeactivated && (
                <span className="text-[#717783]">
                  Clientes desactivados no aparecen en el POS
                </span>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold text-[11px] uppercase tracking-wider select-none shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 w-24">CÓDIGO</th>
                    <th className="py-2.5 px-3">NOMBRE DEL CLIENTE</th>
                    <th className="py-2.5 px-3 w-32">RFC / FISCAL</th>
                    <th className="py-2.5 px-3 w-32">TELÉFONO</th>
                    <th className="py-2.5 px-3 text-right w-28">LÍMITE CRÉDITO</th>
                    <th className="py-2.5 px-3 text-right w-28">DEUDA ACTUAL</th>
                    <th className="py-2.5 px-3 text-center w-28">ESTADO</th>
                    <th className="py-2.5 px-3 text-center w-48">ACCIONES</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-[#717783]">
                        <Users size={40} className="mx-auto mb-2 text-[#D1D1D1]" />
                        <p className="text-xs font-semibold text-[#1B1B1B]">No se encontraron clientes registrados</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const hasDebt = cust.currentDebt > 0
                      const isSelected = selectedCustomerId === cust.id

                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomerId(cust.id)}
                          className={`transition-colors cursor-pointer group ${
                            isSelected
                              ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]'
                              : 'even:bg-[#FDFDFD] hover:bg-[#F9F9F9]'
                          }`}
                          style={{ height: '40px' }}
                        >
                          <td className="py-2 px-3 font-mono text-xs text-[#5C5C5C] font-semibold">
                            {cust.code}
                          </td>

                          <td className="py-2 px-3">
                            <div className="font-semibold text-xs text-[#1B1B1B]">{cust.name}</div>
                            {cust.address && (
                              <div className="text-[11px] text-[#717783] truncate max-w-xs">
                                {cust.address}
                              </div>
                            )}
                          </td>

                          <td className="py-2 px-3 font-mono text-[11px] text-[#5C5C5C]">
                            {cust.taxId}
                          </td>

                          <td className="py-2 px-3 font-mono text-xs text-[#5C5C5C]">
                            {cust.phone || 'S/N'}
                          </td>

                          <td className="py-2 px-3 text-right font-mono font-medium text-xs text-[#5C5C5C]">
                            ${cust.creditLimit.toFixed(2)}
                          </td>

                          <td className="py-2 px-3 text-right font-mono font-bold text-xs">
                            <span className={hasDebt ? 'text-[#C42B1C]' : 'text-[#107C41]'}>
                              ${cust.currentDebt.toFixed(2)}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                !cust.active
                                  ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                  : hasDebt
                                    ? 'bg-red-50 text-[#C42B1C] border border-red-200'
                                    : 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  !cust.active
                                    ? 'bg-slate-500'
                                    : hasDebt
                                      ? 'bg-[#C42B1C]'
                                      : 'bg-[#107C41]'
                                }`}
                              ></span>
                              {!cust.active ? 'DESACTIVADO' : hasDebt ? 'DEUDOR' : 'AL DÍA'}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenDebtDetails(cust)
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[3px] transition-colors cursor-pointer"
                              >
                                Ver Deuda
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenPayment(cust)
                                }}
                                disabled={!hasDebt}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-[3px] border transition-colors ${
                                  hasDebt
                                    ? 'bg-emerald-50 text-[#107C41] hover:bg-emerald-100 border-emerald-200 cursor-pointer font-bold'
                                    : 'bg-[#F3F3F3] text-[#717783] border-[#E5E5E5] cursor-not-allowed opacity-50'
                                }`}
                              >
                                Abonar Deuda
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleStatus(cust)
                                }}
                                disabled={cust.active && hasDebt}
                                title={
                                  cust.active && hasDebt
                                    ? 'No se puede desactivar mientras tenga deuda pendiente'
                                    : cust.active
                                      ? 'Desactivar cliente'
                                      : 'Activar cliente'
                                }
                                className="p-1 rounded text-[#717783] hover:text-amber-600 hover:bg-amber-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Clock size={13} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCustomer(cust)
                                }}
                                title="Eliminar cliente"
                                className="p-1 rounded text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-[#F9F9F9] border-t border-[#E5E5E5] text-xs text-[#5C5C5C]">
              <span>
                Clientes mostrados: <strong className="text-[#1B1B1B] font-mono">{filteredCustomers.length}</strong> de {showDeactivated ? deactivatedCount : activeCustomers.length}
              </span>
              <span className="text-[11px] text-[#717783]">
                Módulo de crédito y cobranza sincronizado con caja y POS
              </span>
            </div>
          </div>

          {/* Modal: Debt Details */}
          {isDebtModalOpen && selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
              <div className="w-full max-w-xl bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
                <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                      Estado de Cuenta: {selectedCustomer.name}
                    </h3>
                    <p className="text-[11px] text-[#5C5C5C]">Código: {selectedCustomer.code}</p>
                  </div>
                  <button
                    onClick={() => setIsDebtModalOpen(false)}
                    className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5]">
                    <div>
                      <span className="text-[#5C5C5C] block">Límite Autorizado:</span>
                      <span className="text-base font-bold font-mono text-[#1B1B1B]">
                        ${selectedCustomer.creditLimit.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5C5C5C] block">Deuda Pendiente Actual:</span>
                      <span className="text-base font-bold font-mono text-[#C42B1C]">
                        ${selectedCustomer.currentDebt.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5C5C5C] block">Saldo a Favor:</span>
                      <span className="text-base font-bold font-mono text-[#107C41]">
                        ${(selectedCustomer.creditBalance ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-[#1B1B1B] uppercase tracking-wider mb-2">
                      Tickets con Saldo Pendiente
                    </h4>
                    {selectedCustomer.debts.length === 0 ? (
                      <p className="text-xs text-[#107C41] font-semibold py-2">
                        Este cliente se encuentra totalmente al día. No tiene deudas activas.
                      </p>
                    ) : (
                      <div className="border border-[#E5E5E5] rounded-[4px] overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] font-semibold text-[#5C5C5C]">
                            <tr>
                              <th className="py-2 px-3">Ticket</th>
                              <th className="py-2 px-3">Fecha</th>
                              <th className="py-2 px-3 text-right">Total</th>
                              <th className="py-2 px-3 text-right">Pendiente</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E5E5]">
                            {selectedCustomer.debts.map((d) => (
                              <tr key={d.ticketNumber}>
                                <td className="py-2 px-3 font-mono font-semibold text-[#0067C0]">
                                  {d.ticketNumber}
                                </td>
                                <td className="py-2 px-3 text-[#5C5C5C]">{d.date}</td>
                                <td className="py-2 px-3 text-right font-mono">${d.totalAmount.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-[#C42B1C]">
                                  ${d.balance.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-[#1B1B1B] uppercase tracking-wider mb-2">
                      Pagos Recientes
                    </h4>
                    {selectedCustomer.payments.length === 0 ? (
                      <p className="text-xs text-[#107C41] font-semibold py-2">
                        No se han registrado pagos para este cliente.
                      </p>
                    ) : (
                      <div className="border border-[#E5E5E5] rounded-[4px] overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] font-semibold text-[#5C5C5C]">
                            <tr>
                              <th className="py-2 px-3">Fecha</th>
                              <th className="py-2 px-3 text-right">Monto</th>
                              <th className="py-2 px-3">Concepto</th>
                              <th className="py-2 px-3">Cajero</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E5E5]">
                            {selectedCustomer.payments.map((p) => (
                              <tr key={p.id}>
                                <td className="py-2 px-3 text-xs font-mono text-[#5C5C5C]">{p.date}</td>
                                <td className="py-2 px-3 text-right font-mono">-${p.amount.toFixed(2)}</td>
                                <td className="py-2 px-3 text-xs text-[#1B1B1B] truncate">{p.concept}</td>
                                <td className="py-2 px-3 text-xs text-[#5C5C5C]">{p.cashierName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
                  <button
                    onClick={() => setIsDebtModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Add Payment / Abono */}
          {isPaymentModalOpen && selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
              <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
                <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                      Registrar Abono a Cuenta
                    </h3>
                    <p className="text-[11px] text-[#5C5C5C]">{selectedCustomer.name}</p>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmitPayment}>
                  <div className="p-5 space-y-4 text-xs">
                    <div className="p-3 bg-red-50/50 border border-red-200 rounded-[4px] flex justify-between items-center">
                      <span className="text-[#5C5C5C]">Saldo Deudor Actual:</span>
                      <span className="text-lg font-bold font-mono text-[#C42B1C]">
                        ${selectedCustomer.currentDebt.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1B1B1B] mb-1">
                        Monto a Abonar en Efectivo ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedCustomer.currentDebt}
                        required
                        autoFocus
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xl font-bold font-mono text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1B1B1B] mb-1">Concepto</label>
                      <input
                        type="text"
                        value={paymentConcept}
                        onChange={(e) => setPaymentConcept(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] rounded-[4px] shadow-xs"
                    >
                      Confirmar e Ingresar a Caja
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: New Customer */}
          {isNewCustomerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
              <div className="w-full max-w-lg bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
                <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                    Registrar Nuevo Cliente
                  </h3>
                  <button
                    onClick={() => setIsNewCustomerModalOpen(false)}
                    className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmitNewCustomer}>
                  <div className="p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1B1B1B] mb-1">Código</label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F9F9F9] font-mono border border-[#D1D1D1] rounded-[4px]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1B1B1B] mb-1">RFC / ID Fiscal</label>
                        <input
                          type="text"
                          placeholder="XAXX010101000"
                          value={newTaxId}
                          onChange={(e) => setNewTaxId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1B1B1B] mb-1">Nombre Completo o Razón Social</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Ej. Distribuidora del Norte S.A."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1B1B1B] mb-1">Teléfono</label>
                        <input
                          type="text"
                          placeholder="55-1234-5678"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1B1B1B] mb-1">Límite de Crédito ($)</label>
                        <input
                          type="number"
                          step="500"
                          min="0"
                          value={newCreditLimit}
                          onChange={(e) => setNewCreditLimit(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white font-mono font-bold border border-[#D1D1D1] rounded-[4px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1B1B1B] mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1B1B1B] mb-1">Dirección de Entrega</label>
                      <input
                        type="text"
                        placeholder="Calle, número, colonia, ciudad..."
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px]"
                      />
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs"
                    >
                      Guardar Cliente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CustomersView
