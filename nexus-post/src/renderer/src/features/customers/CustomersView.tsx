import { useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import type {
  Customer,
  CustomerAccountSummary,
  CustomerInput,
  CustomerPayment
} from '@shared/contracts'
import { AlertCircle } from '../../shared/icons/Icons'
import { useConfirmDialog } from '../../shared/hooks/useConfirmDialog'
import { customersApi, customersErrorMessage } from './api/customers.api'
import { CustomerAccountDialog } from './components/CustomerAccountDialog'
import { CustomerFormDialog } from './components/CustomerFormDialog'
import { CustomersHeader } from './components/CustomersHeader'
import { CustomerPaymentDialog } from './components/CustomerPaymentDialog'
import { CustomersMetrics } from './components/CustomersMetrics'
import { CustomersTable } from './components/CustomersTable'
import { CustomersToolbar, type CustomerStatusFilter } from './components/CustomersToolbar'
import { useCustomers } from './hooks/useCustomers'
import { getNextCustomerCode } from './lib/customerCode'

interface CustomersViewProps {
  canManageCustomers: boolean
  canReceivePayments: boolean
  isCashShiftOpen: boolean
  onPaymentReceived?: (payment: CustomerPayment) => void
}

export default function CustomersView({
  canManageCustomers,
  canReceivePayments,
  isCashShiftOpen,
  onPaymentReceived
}: CustomersViewProps): JSX.Element {
  const {
    customers,
    isLoading,
    error,
    reload,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleStatus,
    recordPayment
  } = useCustomers(true, true)
  const { confirm, dialog: confirmationDialog } = useConfirmDialog()
  const accountRequestVersion = useRef(0)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>('ALL')
  const [showDeactivated, setShowDeactivated] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [formCustomer, setFormCustomer] = useState<Customer | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSavingCustomer, setIsSavingCustomer] = useState(false)
  const [accountCustomer, setAccountCustomer] = useState<Customer | null>(null)
  const [accountSummary, setAccountSummary] = useState<CustomerAccountSummary | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isAccountLoading, setIsAccountLoading] = useState(false)
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.active),
    [customers]
  )
  const deactivatedCustomers = useMemo(
    () => customers.filter((customer) => !customer.active),
    [customers]
  )
  const debtorCount = activeCustomers.filter((customer) => customer.currentDebt > 0).length

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase()
    const source = showDeactivated ? deactivatedCustomers : activeCustomers

    return source.filter((customer) => {
      const matchesSearch =
        !query ||
        [
          customer.name,
          customer.code,
          customer.taxId,
          customer.phone,
          customer.email,
          customer.address
        ].some((value) => value.toLocaleLowerCase().includes(query))
      const matchesStatus =
        showDeactivated ||
        statusFilter === 'ALL' ||
        (statusFilter === 'DEBTORS' && customer.currentDebt > 0) ||
        (statusFilter === 'UP_TO_DATE' && customer.currentDebt === 0)
      return matchesSearch && matchesStatus
    })
  }, [activeCustomers, deactivatedCustomers, searchTerm, showDeactivated, statusFilter])

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true)
    try {
      await reload({ includeInactive: true })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOpenAccount = async (customer: Customer): Promise<void> => {
    const requestId = ++accountRequestVersion.current
    setAccountCustomer(customer)
    setAccountSummary(null)
    setAccountError(null)
    setIsAccountOpen(true)
    setIsAccountLoading(true)
    try {
      const summary = await customersApi.getAccountSummary(customer.id)
      if (!summary) throw new Error('No se encontró el estado de cuenta del cliente.')
      if (requestId === accountRequestVersion.current) setAccountSummary(summary)
    } catch (loadError: unknown) {
      if (requestId === accountRequestVersion.current) {
        setAccountError(customersErrorMessage(loadError))
      }
    } finally {
      if (requestId === accountRequestVersion.current) setIsAccountLoading(false)
    }
  }

  const handleSaveCustomer = async (input: CustomerInput, customerId?: string): Promise<void> => {
    setIsSavingCustomer(true)
    try {
      if (customerId) {
        await updateCustomer({ ...input, id: customerId })
      } else {
        await createCustomer(input)
      }
      setIsFormOpen(false)
      await reload({ includeInactive: true })
    } catch {
      // El hook presenta el error en el encabezado del módulo.
    } finally {
      setIsSavingCustomer(false)
    }
  }

  const handleSubmitPayment = async (amount: number, concept: string): Promise<void> => {
    if (!paymentCustomer) return
    setIsSavingPayment(true)
    try {
      const payment = await recordPayment({
        customerId: paymentCustomer.id,
        amount,
        concept: concept || 'Abono a cuenta general'
      })
      onPaymentReceived?.(payment)
      setIsPaymentOpen(false)
      await reload({ includeInactive: true })
    } catch {
      // El hook presenta el error en el encabezado del módulo.
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleToggleStatus = async (customer: Customer): Promise<void> => {
    const activating = !customer.active
    const confirmed = await confirm({
      title: activating ? 'Activar cliente' : 'Desactivar cliente',
      message: activating
        ? `¿Desea volver a habilitar a "${customer.name}" para nuevas ventas?`
        : `¿Desea desactivar a "${customer.name}"? Se conservarán su historial y sus documentos.`,
      confirmLabel: activating ? 'Activar cliente' : 'Desactivar cliente',
      intent: activating ? 'primary' : 'danger'
    })
    if (!confirmed) return

    try {
      await toggleStatus(customer.id)
      await reload({ includeInactive: true })
    } catch {
      // El hook presenta el error en el encabezado del módulo.
    }
  }

  const handleDeleteCustomer = async (customer: Customer): Promise<void> => {
    const confirmed = await confirm({
      title: 'Dar de baja al cliente',
      message: (
        <span>
          ¿Dar de baja a <strong>{customer.name}</strong>? La baja es lógica; se conservarán las
          ventas y los movimientos históricos. Esta acción no se puede deshacer desde esta vista.
        </span>
      ),
      confirmLabel: 'Dar de baja',
      intent: 'danger'
    })
    if (!confirmed) return

    try {
      await deleteCustomer(customer.id)
      await reload({ includeInactive: true })
    } catch {
      // El hook presenta el error en el encabezado del módulo.
    }
  }

  const handleSwitchList = (): void => {
    setShowDeactivated((current) => !current)
    setStatusFilter('ALL')
    setSelectedCustomerId(null)
  }

  const openNewCustomerForm = (): void => {
    setFormCustomer(null)
    setIsFormOpen(true)
  }

  const openEditCustomerForm = (customer: Customer): void => {
    setFormCustomer(customer)
    setIsFormOpen(true)
  }

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-[#F3F3F3] p-4">
      <CustomersHeader
        canManageCustomers={canManageCustomers}
        canReceivePayments={canReceivePayments}
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-[#C42B1C]"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-xs text-[#5C5C5C]">
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0067C0] border-t-transparent" />
          Cargando directorio de clientes…
        </div>
      ) : (
        <>
          <CustomersMetrics customers={customers} deactivatedCount={deactivatedCustomers.length} />
          <CustomersToolbar
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            showDeactivated={showDeactivated}
            activeCount={activeCustomers.length}
            debtorCount={debtorCount}
            resultCount={filteredCustomers.length}
            canManageCustomers={canManageCustomers}
            isRefreshing={isRefreshing}
            onSearchChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            onToggleDeactivated={handleSwitchList}
            onCreateCustomer={openNewCustomerForm}
            onRefresh={() => void handleRefresh()}
          />
          <CustomersTable
            customers={filteredCustomers}
            selectedCustomerId={selectedCustomerId}
            showDeactivated={showDeactivated}
            canManageCustomers={canManageCustomers}
            canReceivePayments={canReceivePayments}
            isCashShiftOpen={isCashShiftOpen}
            onSelect={setSelectedCustomerId}
            onViewAccount={(customer) => void handleOpenAccount(customer)}
            onReceivePayment={(customer) => {
              setPaymentCustomer(customer)
              setIsPaymentOpen(true)
            }}
            onEdit={openEditCustomerForm}
            onToggleStatus={(customer) => void handleToggleStatus(customer)}
            onDelete={(customer) => void handleDeleteCustomer(customer)}
          />
        </>
      )}

      {isFormOpen && (
        <CustomerFormDialog
          isOpen
          customer={formCustomer}
          suggestedCode={getNextCustomerCode(customers)}
          isSaving={isSavingCustomer}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveCustomer}
        />
      )}
      <CustomerAccountDialog
        isOpen={isAccountOpen}
        customer={accountCustomer}
        summary={accountSummary}
        isLoading={isAccountLoading}
        error={accountError}
        onClose={() => {
          accountRequestVersion.current += 1
          setIsAccountOpen(false)
        }}
      />
      {isPaymentOpen && (
        <CustomerPaymentDialog
          isOpen
          customer={paymentCustomer}
          isSaving={isSavingPayment}
          onClose={() => setIsPaymentOpen(false)}
          onSubmit={handleSubmitPayment}
        />
      )}
      {confirmationDialog}
    </main>
  )
}
