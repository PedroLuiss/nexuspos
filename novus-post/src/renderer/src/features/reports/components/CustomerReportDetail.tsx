import type {
  CurrencyCode,
  CurrencyVesExchangeRate,
  CustomerAccountSummary
} from '@shared/contracts'
import { Modal } from '../../../shared/ui/Modal'
import { formatCurrency } from '../../../shared/lib/currency'
import { ReportMoney } from './ReportMoney'

interface CustomerReportDetailProps {
  customerName: string
  account: CustomerAccountSummary | null
  rate: CurrencyVesExchangeRate | null
  loading: boolean
  error: string | null
  onClose: () => void
}

const date = (value: string): string => new Date(value).toLocaleDateString('es-VE')

export function CustomerReportDetail({
  customerName,
  account,
  rate,
  loading,
  error,
  onClose
}: CustomerReportDetailProps): React.JSX.Element {
  const customer = account?.customer
  const paidByCurrency = new Map<CurrencyCode, number>()
  account?.payments.forEach((payment) => {
    paidByCurrency.set(
      payment.currency,
      (paidByCurrency.get(payment.currency) ?? 0) + payment.amount
    )
  })
  return (
    <Modal
      isOpen={Boolean(customerName)}
      onClose={onClose}
      title={`Información del cliente · ${customerName}`}
      width="max-w-3xl"
    >
      {loading && (
        <p role="status" className="py-8 text-center text-sm">
          Cargando información del cliente…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {customer && account && (
        <div className="space-y-4">
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase text-[#5C5C5C]">Datos del cliente</h4>
            <dl className="grid gap-2 sm:grid-cols-2">
              <Info label="Código" value={customer.code} rate={rate} />
              <Info label="Identificación fiscal" value={customer.taxId} rate={rate} />
              <Info label="Teléfono" value={customer.phone} rate={rate} />
              <Info label="Correo" value={customer.email} rate={rate} />
              <Info label="Dirección" value={customer.address} rate={rate} />
              <Info
                label="Estado"
                value={customer.deleted ? 'Eliminado' : customer.active ? 'Activo' : 'Desactivado'}
                rate={rate}
              />
              <Info
                label="Límite de crédito"
                amount={customer.creditLimit}
                currency={customer.currency}
                rate={rate}
              />
              <Info label="Deuda actual" amount={account.totalDebt} currency={customer.currency} rate={rate} />
              <Info
                label="Saldo a favor"
                amount={account.customerCreditBalance}
                currency={customer.currency}
                rate={rate}
              />
              <Info
                label="Crédito disponible"
                amount={account.availableCredit}
                currency={customer.currency}
                rate={rate}
              />
              <div className="min-w-0 rounded border border-[#E5E5E5] bg-[#F9F9F9] p-2">
                <dt className="text-[10px] font-semibold uppercase text-[#717783]">
                  Total abonado
                </dt>
                <dd className="break-words text-xs font-medium">
                  {paidByCurrency.size === 0
                    ? '—'
                    : [...paidByCurrency].map(([currency, amount]) => (
                        <span key={currency} className="block">
                          {formatCurrency(amount, currency)}
                        </span>
                      ))}
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase text-[#5C5C5C]">Deudas pendientes</h4>
            {account.debts.length === 0 ? (
              <p className="text-xs text-[#717783]">No tiene deudas pendientes.</p>
            ) : (
              <div className="max-h-40 overflow-auto rounded border border-[#E5E5E5]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#F3F3F3]">
                    <tr>
                      <th className="p-2">Factura</th>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Saldo</th>
                      <th className="p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.debts.map((debt) => (
                      <tr key={debt.id} className="border-t border-[#E5E5E5]">
                        <td className="p-2">{debt.ticketNumber}</td>
                        <td className="p-2">{date(debt.date)}</td>
                        <td className="p-2">
                          <ReportMoney
                            amount={debt.totalAmount}
                            rate={rate}
                            currency={debt.currency}
                          />
                        </td>
                        <td className="p-2">
                          <ReportMoney amount={debt.balance} rate={rate} currency={debt.currency} />
                        </td>
                        <td className="p-2">{debt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase text-[#5C5C5C]">Historial de abonos</h4>
            {account.payments.length === 0 ? (
              <p className="text-xs text-[#717783]">No tiene abonos registrados.</p>
            ) : (
              <div className="max-h-40 overflow-auto rounded border border-[#E5E5E5]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#F3F3F3]">
                    <tr>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Concepto</th>
                      <th className="p-2">Registrado por</th>
                      <th className="p-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.payments.map((payment) => (
                      <tr key={payment.id} className="border-t border-[#E5E5E5]">
                        <td className="p-2">{date(payment.date)}</td>
                        <td className="p-2">{payment.concept}</td>
                        <td className="p-2">{payment.cashierName}</td>
                        <td className="p-2">
                          <ReportMoney
                            amount={payment.amount}
                            rate={rate}
                            currency={payment.currency}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}

function Info({
  label,
  value,
  amount,
  currency,
  rate
}: {
  label: string
  value?: string
  amount?: number
  currency?: CurrencyCode
  rate: CurrencyVesExchangeRate | null
}): React.JSX.Element {
  return (
    <div className="min-w-0 rounded border border-[#E5E5E5] bg-[#F9F9F9] p-2">
      <dt className="text-[10px] font-semibold uppercase text-[#717783]">{label}</dt>
      <dd className="break-words text-xs font-medium">
        {amount !== undefined && currency ? (
          <ReportMoney amount={amount} rate={rate} currency={currency} />
        ) : (
          value || '—'
        )}
      </dd>
    </div>
  )
}
