import { useState } from 'react'
import type { ReportGrouping, ReportPeriod } from '@shared/contracts'
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  RefreshCw
} from '../../shared/icons/Icons'
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
  const { data, isLoading, error, reload } = useReports({ period, year, grouping })
  const { rate, error: rateError } = useReportsExchangeRate()

  return (
    <main className="flex h-full flex-col gap-4 overflow-y-auto bg-[#F3F3F3] p-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <div className="flex min-w-64 items-start gap-3">
          <span className="rounded-lg bg-[#0067C0]/10 p-2.5 text-[#0067C0]">
            <ChartNoAxesCombined size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0067C0]">
              Analítica del negocio
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1B1B1B]">
              Rendimiento y reportes
            </h2>
            <p className="mt-1 text-xs text-[#5C5C5C]">
              Indicadores consolidados desde las ventas guardadas localmente
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-56 items-center gap-2 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2">
            <CircleDollarSign size={18} className="shrink-0 text-[#0067C0]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#717783]">
                Tasa de referencia BCV
              </p>
              <p className="truncate text-xs font-semibold text-[#1B1B1B]">
                {rate
                  ? `${rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs./USD`
                  : rateError
                    ? 'No disponible'
                    : 'Consultando…'}
              </p>
              <p className="truncate text-[10px] text-[#717783]">
                {rate
                  ? `${new Date(rate.updatedAt).toLocaleString('es-VE')}${rate.isStale ? ' · desactualizada' : ''}`
                  : rateError
                    ? rateError
                    : 'La conversión es informativa'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            aria-label="Actualizar reportes"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D1D1D1] bg-white px-3 text-xs font-semibold text-[#1B1B1B] shadow-sm transition hover:bg-[#F3F3F3] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={isLoading ? 'animate-spin text-[#0067C0]' : 'text-[#0067C0]'}
              aria-hidden="true"
            />
            Actualizar
          </button>
        </div>
      </header>

      <section
        aria-label="Filtros de reportes"
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-[#F3F3F3] p-1">
            {periods.map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
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
            <label className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C]">
              Año
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="rounded-md border border-[#D1D1D1] bg-white px-2.5 py-2 text-[#1B1B1B] outline-none focus:border-[#0067C0]"
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5C5C5C]">
            <CalendarDays size={15} className="text-[#0067C0]" aria-hidden="true" />
            <span>
              {data
                ? `Período: ${formatDate(data.rangeStart)} – ${formatDate(previousDay(data.rangeEnd))}`
                : isLoading
                  ? 'Calculando período…'
                  : 'Período no disponible'}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-[#F3F3F3] p-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wide text-[#717783]">
              Agrupar
            </span>
            {groupings.map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={grouping === option.value}
                onClick={() => setGrouping(option.value)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  grouping === option.value
                    ? 'bg-white text-[#0067C0] shadow-sm'
                    : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {data && <ReportsKpis kpis={data.kpis} isLoading={isLoading} rate={rate} />}
      {!data && isLoading && <ReportsKpis kpis={emptyKpis} isLoading rate={rate} />}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          <span>No se pudieron cargar los reportes: {error}</span>
          <button
            type="button"
            onClick={reload}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-semibold hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}
      {!data && !error && isLoading && (
        <p
          role="status"
          className="rounded-lg border border-[#E5E5E5] bg-white p-8 text-center text-xs text-[#5C5C5C]"
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
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-900">
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
