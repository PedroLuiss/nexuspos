import type { ReportKpis, UsdVesExchangeRate } from '@shared/contracts'
import { ReportMoney } from './ReportMoney'

interface ReportsKpisProps {
  kpis: ReportKpis
  isLoading: boolean
  rate: UsdVesExchangeRate | null
}

export function ReportsKpis({ kpis, isLoading, rate }: ReportsKpisProps): React.JSX.Element {
  const cards = [
    {
      label: 'Ventas netas (con impuestos)',
      value: null,
      amount: kpis.totalSales,
      detail:
        kpis.growthPercent === null
          ? 'Sin ventas en el período de comparación'
          : `${kpis.growthPercent > 0 ? '+' : ''}${kpis.growthPercent.toFixed(1)}% vs período anterior`,
      color: 'text-[#0067C0]'
    },
    {
      label: 'Utilidad bruta',
      value: null,
      amount: kpis.grossProfit,
      detail: `Margen bruto sobre venta sin impuesto: ${kpis.marginPercent.toFixed(1)}%`,
      color: 'text-emerald-700'
    },
    {
      label: 'Ticket promedio',
      value: null,
      amount: kpis.averageTicket,
      detail: 'Facturación bruta ÷ facturas emitidas',
      color: 'text-purple-700'
    },
    {
      label: 'Facturas emitidas',
      value: kpis.transactionCount.toLocaleString('es-VE'),
      amount: null,
      detail: `${kpis.returnedCount} devoluciones`,
      color: 'text-amber-700'
    }
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          aria-busy={isLoading}
          className="rounded border border-[#E5E5E5] bg-white p-3.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">
            {card.label}
          </span>
          <div className={`mt-1 ${card.color}`}>
            {isLoading ? (
              '…'
            ) : card.amount !== null ? (
              <ReportMoney amount={card.amount} rate={rate} prominent />
            ) : (
              <strong className="block font-mono text-2xl">{card.value}</strong>
            )}
          </div>
          <span className="mt-1 block text-[10px] text-[#5C5C5C]">
            {isLoading ? 'Cargando datos reales…' : card.detail}
          </span>
          {card.label === 'Facturas emitidas' && (
            <div className="mt-1 text-[10px] text-amber-700">
              Devoluciones por{' '}
              {isLoading ? '…' : <ReportMoney amount={kpis.returnedAmount} rate={rate} />}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
