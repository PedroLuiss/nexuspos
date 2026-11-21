import type { JSX } from 'react'
import type { Customer } from '@shared/contracts'
import {
  AlertCircle,
  CreditCard,
  Eye,
  Pencil,
  RotateCcw,
  Users,
  X
} from '../../../shared/icons/Icons'
import { formatCurrency } from '../../../shared/lib/currency'

interface CustomersTableProps {
  customers: Customer[]
  selectedCustomerId: string | null
  showDeactivated: boolean
  canManageCustomers: boolean
  canReceivePayments: boolean
  isCashShiftOpen: boolean
  onSelect: (id: string) => void
  onViewAccount: (customer: Customer) => void
  onReceivePayment: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onToggleStatus: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomersTable({
  customers,
  selectedCustomerId,
  showDeactivated,
  canManageCustomers,
  canReceivePayments,
  isCashShiftOpen,
  onSelect,
  onViewAccount,
  onReceivePayment,
  onEdit,
  onToggleStatus,
  onDelete
}: CustomersTableProps): JSX.Element {
  const actionColumnCount = 1 + Number(canReceivePayments) + 3 * Number(canManageCustomers)

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-[#1B1B1B]">
            {showDeactivated ? 'Directorio de clientes desactivados' : 'Directorio de clientes'}
          </h2>
          <p className="mt-0.5 text-[11px] text-[#717783]">
            {showDeactivated
              ? 'Estos clientes no están disponibles para nuevas ventas en el POS.'
              : 'Consulta los datos comerciales, el límite de crédito y el saldo de cada cuenta.'}
          </p>
        </div>
        <span className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5C5C5C]">
          {customers.length} registros
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[970px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-[#E5E5E5] bg-[#F9F9F9] text-[10px] font-bold uppercase tracking-wider text-[#5C5C5C]">
            <tr>
              <th className="w-24 px-3 py-3">Código</th>
              <th className="px-3 py-3">Cliente / contacto</th>
              <th className="w-36 px-3 py-3">RFC / fiscal</th>
              <th className="w-32 px-3 py-3">Teléfono</th>
              <th className="w-32 px-3 py-3 text-right">Límite</th>
              <th className="w-32 px-3 py-3 text-right">Saldo deudor</th>
              <th className="w-32 px-3 py-3 text-center">Estado</th>
              <th className="w-56 px-3 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEEEE]">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <Users size={34} aria-hidden="true" className="mx-auto mb-2 text-[#B8BEC7]" />
                  <p className="text-sm font-semibold text-[#1B1B1B]">
                    {showDeactivated
                      ? 'No hay clientes desactivados'
                      : 'No se encontraron clientes'}
                  </p>
                  <p className="mt-1 text-xs text-[#717783]">
                    Ajusta la búsqueda o revisa los filtros seleccionados.
                  </p>
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const hasDebt = customer.currentDebt > 0
                const selected = selectedCustomerId === customer.id
                const stateLabel = !customer.active
                  ? 'Desactivado'
                  : hasDebt
                    ? 'Con deuda'
                    : 'Al día'

                return (
                  <tr
                    key={customer.id}
                    onClick={() => onSelect(customer.id)}
                    className={`h-14 cursor-pointer transition-colors ${
                      selected ? 'bg-blue-50/80' : 'hover:bg-[#F8FAFC] even:bg-[#FDFDFD]'
                    }`}
                  >
                    <td className="px-3 py-2 font-mono font-semibold text-[#5C5C5C]">
                      {customer.code}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[#1B1B1B]">{customer.name}</p>
                      <p className="mt-0.5 max-w-[280px] truncate text-[11px] text-[#717783]">
                        {customer.email ||
                          customer.address ||
                          'Sin correo ni dirección registrados'}
                      </p>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#5C5C5C]">
                      {customer.taxId || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[#5C5C5C]">{customer.phone || '—'}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#5C5C5C]">
                      {formatCurrency(customer.creditLimit, customer.currency)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      <span className={hasDebt ? 'text-[#C42B1C]' : 'text-[#107C41]'}>
                        {formatCurrency(customer.currentDebt, customer.currency)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${
                          !customer.active
                            ? 'border-slate-200 bg-slate-50 text-slate-600'
                            : hasDebt
                              ? 'border-red-200 bg-red-50 text-[#C42B1C]'
                              : 'border-emerald-200 bg-emerald-50 text-[#107C41]'
                        }`}
                      >
                        {!customer.active || hasDebt ? (
                          <AlertCircle size={11} />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#107C41]" />
                        )}
                        {stateLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Ver estado de cuenta"
                          aria-label={`Ver cuenta de ${customer.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onViewAccount(customer)
                          }}
                          className="rounded p-1.5 text-[#5C5C5C] transition hover:bg-blue-50 hover:text-[#0067C0]"
                        >
                          <Eye size={14} />
                        </button>
                        {canReceivePayments && (
                          <button
                            type="button"
                            title={
                              !isCashShiftOpen
                                ? 'Abre un turno de caja para registrar abonos'
                                : hasDebt
                                  ? 'Registrar abono'
                                  : 'El cliente no tiene deuda'
                            }
                            aria-label={`Registrar abono de ${customer.name}`}
                            disabled={!hasDebt || !customer.active || !isCashShiftOpen}
                            onClick={(event) => {
                              event.stopPropagation()
                              onReceivePayment(customer)
                            }}
                            className="rounded p-1.5 text-[#107C41] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <CreditCard size={14} />
                          </button>
                        )}
                        {canManageCustomers && (
                          <>
                            <button
                              type="button"
                              title="Editar cliente"
                              aria-label={`Editar ${customer.name}`}
                              onClick={(event) => {
                                event.stopPropagation()
                                onEdit(customer)
                              }}
                              className="rounded p-1.5 text-[#5C5C5C] transition hover:bg-blue-50 hover:text-[#0067C0]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              title={
                                customer.active && hasDebt
                                  ? 'No se puede desactivar mientras tenga deuda pendiente'
                                  : customer.active
                                    ? 'Desactivar cliente'
                                    : 'Activar cliente'
                              }
                              aria-label={`${customer.active ? 'Desactivar' : 'Activar'} ${customer.name}`}
                              disabled={customer.active && hasDebt}
                              onClick={(event) => {
                                event.stopPropagation()
                                onToggleStatus(customer)
                              }}
                              className="rounded p-1.5 text-[#5C5C5C] transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              type="button"
                              title={
                                hasDebt
                                  ? 'No se puede dar de baja mientras tenga deuda pendiente'
                                  : 'Dar de baja (conservar historial)'
                              }
                              aria-label={`Dar de baja a ${customer.name}`}
                              disabled={hasDebt}
                              onClick={(event) => {
                                event.stopPropagation()
                                onDelete(customer)
                              }}
                              className="rounded p-1.5 text-[#717783] transition hover:bg-red-50 hover:text-[#C42B1C] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] px-4 py-2 text-[11px] text-[#717783]">
        <span>
          Mostrando <strong className="font-mono text-[#1B1B1B]">{customers.length}</strong>{' '}
          registros
        </span>
        <span>
          {canReceivePayments && !isCashShiftOpen
            ? 'Abre un turno de caja para habilitar el registro de abonos.'
            : actionColumnCount > 1
              ? 'La deuda se aplica por orden de antigüedad y cada abono queda registrado en caja.'
              : 'Vista de consulta: las operaciones dependen del rol asignado.'}
        </span>
      </div>
    </section>
  )
}
