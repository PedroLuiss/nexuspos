import { useMemo, useState } from 'react'
import type { CashRegisterData } from '@shared/contracts'
import { formatCurrency, formatCurrencyTotals } from '../../../shared/lib/currency'

interface CashShiftHistoryPanelProps {
  options: CashRegisterData['shiftOptions']
  selectedShiftId?: string
  disabled: boolean
  onSelect: (shiftId: string) => void
  onRefresh: () => void
  onClose: () => void
}

type DateRange = 'ALL' | 'TODAY' | '7D' | '30D'

const formatDate = (date: string | undefined): string =>
  date ? new Date(date).toLocaleString('es-VE') : '—'

function formatDuration(openedAt: string, closedAt?: string): string {
  if (!closedAt) return '—'
  const start = new Date(openedAt).getTime()
  const end = new Date(closedAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '—'
  const durationMinutes = Math.max(0, Math.floor((end - start) / 60_000))
  const days = Math.floor(durationMinutes / 1440)
  const hours = Math.floor((durationMinutes % 1440) / 60)
  const minutes = durationMinutes % 60
  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

function isWithinDateRange(date: string | undefined, range: DateRange): boolean {
  if (range === 'ALL') return true
  if (!date) return false

  const timestamp = new Date(date).getTime()
  if (!Number.isFinite(timestamp)) return false

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (range === '7D') start.setDate(start.getDate() - 6)
  if (range === '30D') start.setDate(start.getDate() - 29)
  return timestamp >= start.getTime()
}

export function CashShiftHistoryPanel({
  options,
  selectedShiftId,
  disabled,
  onSelect,
  onRefresh,
  onClose
}: CashShiftHistoryPanelProps): React.JSX.Element {
  const [cashierFilter, setCashierFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('ALL')
  const closedShifts = useMemo(() => options.filter((option) => option.closedAt), [options])
  const filteredShifts = closedShifts.filter(
    (option) =>
      `${option.cashierName} ${option.stationName}`
        .toLocaleLowerCase()
        .includes(cashierFilter.trim().toLocaleLowerCase()) &&
      isWithinDateRange(option.closedAt, dateRange)
  )
  const balancedCount = filteredShifts.filter((shift) => shift.difference === 0).length
  const shortfalls = filteredShifts.filter((shift) => (shift.difference ?? 0) < 0)
  const surpluses = filteredShifts.filter((shift) => (shift.difference ?? 0) > 0)
  const shortfallTotal = formatCurrencyTotals(
    shortfalls.map((shift) => ({
      amount: Math.abs(shift.difference ?? 0),
      currency: shift.currency
    }))
  )
  const surplusTotal = formatCurrencyTotals(
    surpluses.map((shift) => ({ amount: shift.difference ?? 0, currency: shift.currency }))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded border border-[#D1D1D1] bg-white shadow-xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold uppercase">Cajas cerradas de todos los cajeros</h3>
            <p className="mt-1 text-xs text-[#5C5C5C]">
              Auditoría de turnos · {filteredShifts.length} de {closedShifts.length} registros
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C]">
              Cajero
              <input
                type="search"
                value={cashierFilter}
                onChange={(event) => setCashierFilter(event.target.value)}
                placeholder="Nombre del cajero o caja"
                className="rounded border border-[#D1D1D1] bg-white px-2 py-1.5 font-normal text-[#1B1B1B]"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C]">
              Cierre
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value as DateRange)}
                className="rounded border border-[#D1D1D1] bg-white px-2 py-1.5 font-normal text-[#1B1B1B]"
              >
                <option value="ALL">Todo el historial</option>
                <option value="TODAY">Hoy</option>
                <option value="7D">Últimos 7 días</option>
                <option value="30D">Últimos 30 días</option>
              </select>
            </label>
            <button
              type="button"
              onClick={onRefresh}
              disabled={disabled}
              className="rounded border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[#F3F3F3] disabled:opacity-50"
            >
              {disabled ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </header>
        <div className="grid gap-2 border-b border-[#E5E5E5] bg-[#F9F9F9] p-3 sm:grid-cols-2 xl:grid-cols-4">
          <HistoryMetric
            label="Turnos cerrados"
            value={filteredShifts.length.toLocaleString('es-VE')}
          />
          <HistoryMetric
            label="Cuadre exacto"
            value={balancedCount.toLocaleString('es-VE')}
            detail={`${filteredShifts.length ? ((balancedCount / filteredShifts.length) * 100).toFixed(0) : 0}% de los resultados`}
          />
          <HistoryMetric
            label="Faltantes acumulados"
            value={shortfallTotal || '—'}
            detail={`${shortfalls.length} turnos con diferencia`}
            tone="danger"
          />
          <HistoryMetric
            label="Sobrantes acumulados"
            value={surplusTotal || '—'}
            detail={`${surpluses.length} turnos con diferencia`}
            tone="warning"
          />
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[1250px] text-left text-xs">
            <thead className="sticky top-0 bg-white text-[10px] uppercase text-[#5C5C5C]">
              <tr className="border-b border-[#E5E5E5]">
                <th className="px-3 py-2">Cajero</th>
                <th className="px-3 py-2">Apertura</th>
                <th className="px-3 py-2">Cierre</th>
                <th className="px-3 py-2">Duración</th>
                <th className="px-3 py-2 text-right">Fondo inicial</th>
                <th className="px-3 py-2 text-right">Esperado</th>
                <th className="px-3 py-2 text-right">Contado</th>
                <th className="px-3 py-2 text-right">Desviación</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-[#717783]">
                    {closedShifts.length === 0
                      ? 'Todavía no hay cajas cerradas registradas.'
                      : 'No hay turnos que coincidan con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className={
                      shift.id === selectedShiftId ? 'bg-[#0067C0]/5' : 'hover:bg-[#F9F9F9]'
                    }
                  >
                    <td className="whitespace-nowrap px-3 py-2">
                      <strong className="block font-semibold">{shift.cashierName}</strong>
                      <span className="text-[10px] font-semibold text-[#0067C0]">
                        {shift.stationName}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(shift.openedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(shift.closedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#5C5C5C]">
                      {formatDuration(shift.openedAt, shift.closedAt)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(shift.openingAmount, shift.currency)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(shift.expectedCash, shift.currency)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {shift.countedCash === undefined
                        ? '—'
                        : formatCurrency(shift.countedCash, shift.currency)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {shift.difference === undefined ? (
                        <span className="text-[#717783]">Sin dato</span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`font-mono font-semibold ${
                              shift.difference < 0
                                ? 'text-[#C42B1C]'
                                : shift.difference > 0
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                            }`}
                          >
                            {shift.difference < 0 ? '−' : shift.difference > 0 ? '+' : ''}
                            {formatCurrency(Math.abs(shift.difference), shift.currency)}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              shift.difference < 0
                                ? 'border-red-200 bg-red-50 text-[#C42B1C]'
                                : shift.difference > 0
                                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {shift.difference < 0
                              ? 'Faltante'
                              : shift.difference > 0
                                ? 'Sobrante'
                                : 'Cuadrada'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onSelect(shift.id)
                          onClose()
                        }}
                        className="rounded bg-[#0067C0] px-3 py-1.5 font-semibold text-white hover:bg-[#005A9E] disabled:opacity-50"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex justify-end border-t border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  )
}

function HistoryMetric({
  label,
  value,
  detail,
  tone = 'default'
}: {
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'danger' | 'warning'
}): React.JSX.Element {
  const valueColor =
    tone === 'danger' ? 'text-[#C42B1C]' : tone === 'warning' ? 'text-amber-700' : 'text-[#1B1B1B]'

  return (
    <article className="rounded border border-[#E5E5E5] bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold ${valueColor}`}>{value}</p>
      {detail && <p className="mt-0.5 text-[10px] text-[#717783]">{detail}</p>}
    </article>
  )
}
