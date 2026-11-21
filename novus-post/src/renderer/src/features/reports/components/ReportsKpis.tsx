import type { CurrencyCode, ReportKpis, CurrencyVesExchangeRate } from '@shared/contracts'
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ReceiptText,
  TrendingUp
} from '../../../shared/icons/Icons'
import type { LucideIcon } from '../../../shared/icons/Icons'
import { ReportMoney } from './ReportMoney'

interface ReportsKpisProps {
  kpis: ReportKpis
  isLoading: boolean
  rate: CurrencyVesExchangeRate | null
  currency: CurrencyCode
}

export function ReportsKpis({
  kpis,
  isLoading,
  rate,
  currency
}: ReportsKpisProps): React.JSX.Element {
  const cards = [
    {
      label: 'Ventas netas (con impuestos)',
      amount: kpis.totalSales,
      detail:
        kpis.growthPercent === null
          ? 'Sin ventas en el período de comparación'
          : `${kpis.growthPercent > 0 ? '+' : ''}${kpis.growthPercent.toFixed(1)}% vs período anterior`,
      color: 'text-[#0067C0]',
      icon: BadgeDollarSign
    },
    {
      label: 'Utilidad bruta',
      amount: kpis.grossProfit,
      detail: `Margen bruto sobre venta sin impuesto: ${kpis.marginPercent.toFixed(1)}%`,
      color: 'text-emerald-700',
      icon: TrendingUp
    },
    {
      label: 'Ticket promedio',
      amount: kpis.averageTicket,
      detail: 'Facturación bruta ÷ facturas emitidas',
      color: 'text-purple-700',
      icon: ChartNoAxesCombined
    },
    {
      label: 'Facturas emitidas',
      value: kpis.transactionCount.toLocaleString('es-VE'),
      detail: `${kpis.returnedCount} devoluciones`,
      color: 'text-amber-700',
      icon: ReceiptText
    }
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard
          key={card.label}
          card={card}
          isLoading={isLoading}
          rate={rate}
          currency={currency}
          returnedAmount={kpis.returnedAmount}
        />
      ))}
    </div>
  )
}

interface KpiCardData {
  label: string
  amount?: number
  value?: string
  detail: string
  color: string
  icon: LucideIcon
}

function KpiCard({
  card,
  isLoading,
  rate,
  currency,
  returnedAmount
}: {
  card: KpiCardData
  isLoading: boolean
  rate: CurrencyVesExchangeRate | null
  currency: CurrencyCode
  returnedAmount: number
}): React.JSX.Element {
  const Icon = card.icon
  return (
    <article
      aria-busy={isLoading}
      className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">
          {card.label}
        </span>
        <span className={`rounded-md bg-[#F3F3F3] p-1.5 ${card.color}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <div className={`mt-2 ${card.color}`}>
        {isLoading ? (
          <strong className="block font-mono text-2xl">—</strong>
        ) : card.amount !== undefined ? (
          <ReportMoney amount={card.amount} rate={rate} currency={currency} prominent />
        ) : (
          <strong className="block font-mono text-2xl">{card.value}</strong>
        )}
      </div>
      <span className="mt-2 block text-[10px] text-[#5C5C5C]">
        {isLoading ? 'Consultando datos reales…' : card.detail}
      </span>
      {card.label === 'Facturas emitidas' && (
        <div className="mt-2 border-t border-[#F0F0F0] pt-2 text-[10px] text-amber-700">
          Devoluciones por{' '}
          {isLoading ? '…' : <ReportMoney amount={returnedAmount} rate={rate} currency={currency} />}
        </div>
      )}
    </article>
  )
}
