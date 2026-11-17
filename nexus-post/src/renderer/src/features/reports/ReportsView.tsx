import { useState } from 'react'
import type { ReportGrouping, ReportPeriod } from '@shared/contracts'
import { ReportsBusinessImpact } from './components/ReportsBusinessImpact'
import { ReportsKpis } from './components/ReportsKpis'
import { ReportsRankings } from './components/ReportsRankings'
import { SalesTrendChart } from './components/SalesTrendChart'
import { useReports } from './hooks/useReports'
import { useReportsExchangeRate } from './hooks/useReportsExchangeRate'

const periods: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Año' }
]

const groupings: Array<{ value: ReportGrouping; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' }
]

export function ReportsView(): React.JSX.Element {
  const [period, setPeriod] = useState<ReportPeriod>('week')
  const [year, setYear] = useState(new Date().getFullYear())
  const [grouping, setGrouping] = useState<ReportGrouping>('day')
  const { data, isLoading, error } = useReports({ period, year, grouping })
  const { rate, error: rateError } = useReportsExchangeRate()

  return (
    <main className="flex h-full flex-col gap-3 overflow-y-auto bg-[#F3F3F3] p-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#E5E5E5] bg-white p-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide">
            Reportes y análisis del negocio
          </h2>
          <p className="mt-1 text-[11px] text-[#5C5C5C]">
            Indicadores calculados desde las ventas guardadas localmente
          </p>
          <p className="mt-1 text-[11px] text-[#5C5C5C]">
            {rate
              ? `Tasa BCV: ${rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs./USD · ${new Date(rate.updatedAt).toLocaleString('es-VE')}${rate.isStale ? ' · tasa desactualizada' : ''}`
              : rateError
                ? `Tasa BCV no disponible: ${rateError}`
                : 'Consultando tasa BCV…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded border border-[#E5E5E5] bg-[#F3F3F3] p-0.5">
            {periods.map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded px-2.5 py-1.5 text-xs font-semibold ${
                  period === option.value
                    ? 'bg-white text-[#0067C0] shadow-sm'
                    : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {period === 'year' && (
            <label className="flex items-center gap-1 text-xs font-semibold text-[#5C5C5C]">
              Año
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="rounded border border-[#D1D1D1] bg-white px-2 py-1.5 text-[#1B1B1B]"
              >
                {(data?.availableYears ?? [year]).map((availableYear) => (
                  <option key={availableYear} value={availableYear}>
                    {availableYear}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      <ReportsKpis kpis={data?.kpis ?? emptyKpis} isLoading={isLoading} rate={rate} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#E5E5E5] bg-white px-3 py-2">
        <div className="text-[11px] text-[#5C5C5C]">
          {data
            ? `Período consultado: ${formatDate(data.rangeStart)} – ${formatDate(previousDay(data.rangeEnd))}`
            : 'Preparando período de consulta…'}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[10px] font-semibold uppercase text-[#5C5C5C]">
            Agrupar gráfico:
          </span>
          {groupings.map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={grouping === option.value}
              onClick={() => setGrouping(option.value)}
              className={`rounded px-2 py-1 text-[11px] font-semibold ${
                grouping === option.value
                  ? 'bg-[#0067C0]/10 text-[#0067C0]'
                  : 'text-[#5C5C5C] hover:bg-[#F3F3F3]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          No se pudieron cargar los reportes: {error}
        </div>
      )}
      {!data && !error && isLoading && (
        <p
          role="status"
          className="rounded border border-[#E5E5E5] bg-white p-8 text-center text-xs text-[#5C5C5C]"
        >
          Consultando las ventas guardadas…
        </p>
      )}
      {data && (
        <>
          <SalesTrendChart
            points={data.series}
            grouping={grouping}
            isLoading={isLoading}
            rate={rate}
          />
          <ReportsRankings data={data} rate={rate} />
          <ReportsBusinessImpact data={data} rate={rate} />
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">
            La utilidad bruta se calcula con el costo guardado en cada línea de venta. Tickets
            antiguos sin costo histórico pueden mostrar una utilidad distinta a la real; este
            reporte no resta gastos operativos registrados fuera de ventas.
          </p>
        </>
      )}
    </main>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-VE')
}

function previousDay(value: string): string {
  const date = new Date(value)
  date.setDate(date.getDate() - 1)
  return date.toISOString()
}

const emptyKpis = {
  totalSales: 0,
  grossSales: 0,
  grossProfit: 0,
  averageTicket: 0,
  transactionCount: 0,
  growthPercent: null,
  returnedCount: 0,
  returnedAmount: 0,
  marginPercent: 0
}

export default ReportsView
