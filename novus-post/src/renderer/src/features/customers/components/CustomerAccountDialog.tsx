import type { JSX } from 'react'
import type { Customer, CustomerAccountSummary } from '@shared/contracts'
import { AlertCircle, CheckCircle2 } from '../../../shared/icons/Icons'
import { Modal } from '../../../shared/ui/Modal'
import { formatCurrency, formatCurrencyTotals } from '../../../shared/lib/currency'

interface CustomerAccountDialogProps {
  isOpen: boolean
  customer: Customer | null
  summary: CustomerAccountSummary | null
  isLoading: boolean
  error: string | null
  onClose: () => void
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export function CustomerAccountDialog({
  isOpen,
  customer,
  summary,
  isLoading,
  error,
  onClose
}: CustomerAccountDialogProps): JSX.Element {
  const accountCustomer = summary?.customer ?? customer
  const accountMetrics: { label: string; value: number }[] = summary
    ? [
        { label: 'Límite de crédito', value: summary.customer.creditLimit },
        { label: 'Deuda pendiente', value: summary.totalDebt },
        { label: 'Crédito disponible', value: summary.availableCredit },
        { label: 'Saldo a favor', value: summary.customerCreditBalance }
      ]
    : []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estado de cuenta"
      width="max-w-4xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[#D1D1D1] bg-white px-4 py-2 text-xs font-semibold text-[#5C5C5C] hover:bg-[#F3F3F3]"
        >
          Cerrar
        </button>
      }
    >
      {accountCustomer && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1B1B1B]">{accountCustomer.name}</h2>
            <p className="mt-1 text-xs text-[#717783]">
              Código <span className="font-mono font-semibold">{accountCustomer.code}</span>
              {accountCustomer.taxId ? ` · RFC ${accountCustomer.taxId}` : ''}
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              accountCustomer.currentDebt > 0
                ? 'border-red-200 bg-red-50 text-[#C42B1C]'
                : 'border-emerald-200 bg-emerald-50 text-[#107C41]'
            }`}
          >
            {accountCustomer.currentDebt > 0 ? 'Saldo pendiente' : 'Cuenta al día'}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-xs text-[#5C5C5C]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0067C0] border-t-transparent" />
          Cargando movimientos de cuenta…
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-[#C42B1C]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : summary ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {accountMetrics.map(({ label, value }) => (
              <div key={label} className="rounded-md border border-[#E5E5E5] bg-[#F9F9F9] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#717783]">
                  {label}
                </p>
                <p className="mt-2 font-mono text-base font-bold text-[#1B1B1B]">
                  {formatCurrency(value, summary.customer.currency)}
                </p>
              </div>
            ))}
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#1B1B1B]">
                Tickets con saldo pendiente
              </h3>
              <span className="text-[11px] text-[#717783]">{summary.debts.length} pendientes</span>
            </div>
            {summary.debts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-xs font-medium text-[#107C41]">
                <CheckCircle2 size={15} />
                No existen deudas activas para este cliente.
              </div>
            ) : (
              <div className="max-h-52 overflow-auto rounded-md border border-[#E5E5E5]">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="sticky top-0 bg-[#F9F9F9] text-[10px] uppercase tracking-wide text-[#717783]">
                    <tr>
                      <th className="px-3 py-2.5">Ticket</th>
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                      <th className="px-3 py-2.5 text-right">Pendiente</th>
                      <th className="px-3 py-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]">
                    {summary.debts.map((debt) => (
                      <tr key={debt.id}>
                        <td className="px-3 py-2 font-mono font-semibold text-[#0067C0]">
                          {debt.ticketNumber}
                        </td>
                        <td className="px-3 py-2 text-[#5C5C5C]">{formatDate(debt.date)}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(debt.totalAmount, debt.currency)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-[#C42B1C]">
                          {formatCurrency(debt.balance, debt.currency)}
                        </td>
                        <td className="px-3 py-2 text-center text-[10px] font-bold text-amber-700">
                          {debt.status === 'PARTIAL' ? 'Parcial' : 'Pendiente'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#1B1B1B]">
                Historial de abonos
              </h3>
              <span className="text-[11px] text-[#717783]">
                Total recibido:{' '}
                {formatCurrencyTotals(
                  summary.payments.map((payment) => ({
                    amount: payment.amount,
                    currency: payment.currency
                  })) || []
                ) || '—'}
              </span>
            </div>
            {summary.payments.length === 0 ? (
              <p className="rounded-md border border-[#E5E5E5] bg-[#F9F9F9] p-3 text-xs text-[#717783]">
                No se han registrado abonos para este cliente.
              </p>
            ) : (
              <div className="max-h-44 overflow-auto rounded-md border border-[#E5E5E5]">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="sticky top-0 bg-[#F9F9F9] text-[10px] uppercase tracking-wide text-[#717783]">
                    <tr>
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5 text-right">Monto</th>
                      <th className="px-3 py-2.5">Concepto</th>
                      <th className="px-3 py-2.5">Cajero / Caja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]">
                    {summary.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-3 py-2 font-mono text-[#5C5C5C]">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-[#107C41]">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="max-w-[260px] truncate px-3 py-2">{payment.concept}</td>
                        <td className="px-3 py-2 text-[#5C5C5C]">
                          <span className="block">{payment.cashierName}</span>
                          {payment.stationName && (
                            <span className="block text-[10px] font-semibold text-[#0067C0]">
                              {payment.stationName}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <p className="py-10 text-center text-xs text-[#717783]">
          Seleccione un cliente para consultar su estado de cuenta.
        </p>
      )}
    </Modal>
  )
}
