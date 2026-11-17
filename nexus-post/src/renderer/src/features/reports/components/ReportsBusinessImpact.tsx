import type { ReportsData, UsdVesExchangeRate } from '@shared/contracts'
import { ReportMoney } from './ReportMoney'

interface ReportsBusinessImpactProps {
  data: ReportsData
  rate: UsdVesExchangeRate | null
}

function percentage(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0
}

export function ReportsBusinessImpact({
  data,
  rate
}: ReportsBusinessImpactProps): React.JSX.Element {
  const strongestBucket = data.series.reduce(
    (best, point) => (!best || point.totalSales > best.totalSales ? point : best),
    data.series[0]
  )
  const topCustomer = data.topCustomers[0]
  const topCustomerShare = topCustomer
    ? percentage(topCustomer.totalSpent, data.kpis.totalSales)
    : 0
  const paymentTotal = data.payments.cash + data.payments.card + data.payments.credit
  const paymentOptions: Array<[string, number]> = [
    ['Efectivo', data.payments.cash],
    ['Tarjeta', data.payments.card],
    ['Crédito', data.payments.credit]
  ]
  const dominantPayment = paymentOptions.sort((a, b) => b[1] - a[1])[0][0]

  return (
    <section className="rounded border border-[#E5E5E5] bg-white p-4">
      <header className="mb-3 border-b border-[#E5E5E5] pb-2">
        <h3 className="text-xs font-bold uppercase">Impacto y oportunidades comerciales</h3>
        <p className="text-[11px] text-[#5C5C5C]">
          Señales calculadas con las transacciones registradas, sin estimaciones externas
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Insight
          label="Mejor período neto"
          amount={strongestBucket?.totalSales}
          rate={rate}
          detail={
            strongestBucket
              ? `${strongestBucket.bucket} · ${strongestBucket.ticketCount} facturas`
              : 'Sin ventas en este período'
          }
        />
        <Insight
          label="Peso del cliente líder"
          value={topCustomer ? `${topCustomerShare.toFixed(1)}%` : '—'}
          rate={rate}
          detail={topCustomer ? topCustomer.customerName : 'Sin compras asociadas a clientes'}
        />
        <Insight
          label="Devoluciones registradas"
          amount={data.kpis.returnedAmount}
          rate={rate}
          detail={`${data.kpis.returnedCount} facturas devueltas en el período`}
        />
        <Insight
          label="Método de pago predominante"
          value={paymentTotal === 0 ? '—' : dominantPayment}
          rate={rate}
          detail={
            paymentTotal === 0 ? (
              'Sin ventas registradas'
            ) : (
              <div className="mt-1 grid gap-1">
                <PaymentAmount label="Efectivo" amount={data.payments.cash} rate={rate} />
                <PaymentAmount label="Tarjeta" amount={data.payments.card} rate={rate} />
                <PaymentAmount label="Crédito" amount={data.payments.credit} rate={rate} />
              </div>
            )
          }
        />
      </div>
      <p className="mt-3 rounded bg-blue-50 px-3 py-2 text-[10px] text-blue-900">
        La concentración del cliente líder puede orientar programas de fidelidad; compara el
        comportamiento entre períodos antes de definir promociones.
      </p>
    </section>
  )
}

function Insight({
  label,
  value,
  amount,
  rate,
  detail
}: {
  label: string
  value?: string
  amount?: number
  rate: UsdVesExchangeRate | null
  detail: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="rounded border border-[#E5E5E5] bg-[#F9F9F9] p-3">
      <span className="block text-[10px] font-bold uppercase text-[#5C5C5C]">{label}</span>
      {amount !== undefined ? (
        <div className="mt-1 text-[#0067C0]">
          <ReportMoney amount={amount} rate={rate} prominent />
        </div>
      ) : (
        <strong className="mt-1 block truncate text-lg font-mono text-[#0067C0]">{value}</strong>
      )}
      <div className="mt-1 text-[10px] text-[#5C5C5C]">{detail}</div>
    </div>
  )
}

function PaymentAmount({
  label,
  amount,
  rate
}: {
  label: string
  amount: number
  rate: UsdVesExchangeRate | null
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-1">
      <span>{label}</span>
      <ReportMoney amount={amount} rate={rate} />
    </div>
  )
}
