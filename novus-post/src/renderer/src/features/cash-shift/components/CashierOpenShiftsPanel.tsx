import { useMemo, useState } from 'react'
import type { CashierMonitorEntry } from '@shared/contracts'
import { Banknote, RefreshCw, Search, X } from '../../../shared/icons/Icons'
import { SummaryCard } from './CashierOpenShiftMetrics'
import { CashierMonitorCard } from './CashierMonitorCard'
import { formatCurrencyTotals } from '../../../shared/lib/currency'

interface CashierOpenShiftsPanelProps {
  cashiers: CashierMonitorEntry[]
  selectedShiftId?: string
  disabled: boolean
  onSelect: (shiftId: string) => void
  onRefresh: () => void
  onClose: () => void
}

export function CashierOpenShiftsPanel({
  cashiers,
  selectedShiftId,
  disabled,
  onSelect,
  onRefresh,
  onClose
}: CashierOpenShiftsPanelProps): React.JSX.Element {
  const [cashierFilter, setCashierFilter] = useState('')
  const filteredCashiers = useMemo(
    () =>
      cashiers.filter((cashier) =>
        `${cashier.cashierName} ${cashier.stationName}`
          .toLocaleLowerCase()
          .includes(cashierFilter.trim().toLocaleLowerCase())
      ),
    [cashierFilter, cashiers]
  )
  const openShifts = cashiers.flatMap((cashier) =>
    cashier.activeShift ? [cashier.activeShift] : []
  )
  const ticketCount = openShifts.reduce((total, shift) => total + shift.ticketCount, 0)
  const netSales = formatCurrencyTotals(
    openShifts.map((shift) => ({ amount: shift.totalSales, currency: shift.currency }))
  )
  const expectedCash = formatCurrencyTotals(
    openShifts.map((shift) => ({ amount: shift.expectedCash, currency: shift.currency }))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-cashiers-title"
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F7F9FC] shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0067C0]/10 text-[#0067C0]">
              <Banknote size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="open-cashiers-title" className="text-sm font-bold text-slate-900">
                  Monitoreo de cajeros y cajas
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    openShifts.length
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      openShifts.length ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  {openShifts.length ? `${openShifts.length} en operación` : 'Sin turnos abiertos'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Supervisión de turnos, ventas y efectivo esperado por cajero y caja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cajas abiertas"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Cajeros supervisados"
              value={cashiers.length.toLocaleString('es-VE')}
              detail={`${cashiers.filter((cashier) => cashier.isActive).length} activos`}
              tone="slate"
            />
            <SummaryCard
              label="Turnos en curso"
              value={openShifts.length.toLocaleString('es-VE')}
              detail="Cajas abiertas ahora"
              tone="blue"
            />
            <SummaryCard
              label="Ventas netas"
              value={netSales || '—'}
              detail={`${ticketCount.toLocaleString('es-VE')} tickets vigentes`}
              tone="green"
            />
            <SummaryCard
              label="Efectivo esperado"
              value={expectedCash || '—'}
              detail="Total estimado en gaveta"
              tone="slate"
            />
          </div>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Detalle por cajero
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {filteredCashiers.length} de {cashiers.length} cajeros
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={cashierFilter}
                    onChange={(event) => setCashierFilter(event.target.value)}
                    placeholder="Buscar cajero o caja"
                    aria-label="Buscar por nombre de cajero o caja"
                    className="w-48 rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none transition focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/10"
                  />
                </label>
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                >
                  <RefreshCw size={13} className={disabled ? 'animate-spin' : ''} />
                  {disabled ? 'Actualizando' : 'Actualizar'}
                </button>
              </div>
            </div>

            {filteredCashiers.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Search size={18} />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-700">
                  {cashiers.length === 0
                    ? 'No hay cajeros activos configurados'
                    : 'No se encontraron cajeros'}
                </p>
                <p className="mt-1 max-w-sm text-[11px] text-slate-500">
                  {cashiers.length === 0
                    ? 'Los usuarios con rol Cajero aparecerán aquí cuando estén activos.'
                    : 'Prueba con otro nombre o limpia el campo de búsqueda.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 p-3 lg:grid-cols-2">
                {filteredCashiers.map((cashier) => (
                  <CashierMonitorCard
                    key={cashier.cashierId}
                    cashier={cashier}
                    selectedShiftId={selectedShiftId}
                    disabled={disabled}
                    onSelect={onSelect}
                    onClose={onClose}
                  />
                ))}
              </div>
            )}
          </section>
          <p className="text-[10px] leading-relaxed text-slate-500">
            La consulta de estas cajas no permite modificarlas ni cerrarlas. Las devoluciones se
            registran únicamente desde el detalle de una factura y requieren permisos de
            administrador.
          </p>
        </div>

        <footer className="flex justify-end border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  )
}
