import { useMemo, useState } from 'react'
import type { CashRegisterData } from '@shared/contracts'
import { Banknote, Clock3, RefreshCw, Search, X } from '../../../shared/icons/Icons'
import { DetailValue, SummaryCard } from './CashierOpenShiftMetrics'

type CashShiftOption = CashRegisterData['shiftOptions'][number]

interface CashierOpenShiftsPanelProps {
  shifts: CashShiftOption[]
  selectedShiftId?: string
  disabled: boolean
  onSelect: (shiftId: string) => void
  onRefresh: () => void
  onClose: () => void
}

const formatDate = (date: string): string =>
  new Date(date).toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const formatMoney = (amount: number): string =>
  `$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function getElapsedTime(openedAt: string): string {
  const openedTime = new Date(openedAt).getTime()
  if (!Number.isFinite(openedTime)) return '—'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - openedTime) / 60_000))
  const days = Math.floor(elapsedMinutes / 1440)
  const hours = Math.floor((elapsedMinutes % 1440) / 60)
  const minutes = elapsedMinutes % 60
  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('')
}

export function CashierOpenShiftsPanel({
  shifts,
  selectedShiftId,
  disabled,
  onSelect,
  onRefresh,
  onClose
}: CashierOpenShiftsPanelProps): React.JSX.Element {
  const [cashierFilter, setCashierFilter] = useState('')
  const filteredShifts = useMemo(
    () =>
      shifts.filter((shift) =>
        shift.cashierName.toLocaleLowerCase().includes(cashierFilter.trim().toLocaleLowerCase())
      ),
    [cashierFilter, shifts]
  )
  const netSales = shifts.reduce((total, shift) => total + shift.totalSales, 0)
  const ticketCount = shifts.reduce((total, shift) => total + shift.ticketCount, 0)
  const expectedCash = shifts.reduce((total, shift) => total + shift.expectedCash, 0)

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
                  Monitoreo de cajas abiertas
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  En operación
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Supervisión de turnos, ventas y efectivo esperado por cajero.
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
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Turnos en curso"
              value={shifts.length.toLocaleString('es-VE')}
              detail="Cajeros con caja abierta"
              tone="blue"
            />
            <SummaryCard
              label="Ventas netas"
              value={formatMoney(netSales)}
              detail={`${ticketCount.toLocaleString('es-VE')} tickets vigentes`}
              tone="green"
            />
            <SummaryCard
              label="Efectivo esperado"
              value={formatMoney(expectedCash)}
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
                  {filteredShifts.length} de {shifts.length} turnos activos
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
                    placeholder="Buscar cajero"
                    aria-label="Buscar por nombre de cajero"
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

            {filteredShifts.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Search size={18} />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-700">
                  {shifts.length === 0
                    ? 'No hay cajas de cajeros abiertas'
                    : 'No se encontraron cajeros'}
                </p>
                <p className="mt-1 max-w-sm text-[11px] text-slate-500">
                  {shifts.length === 0
                    ? 'Cuando un cajero abra su turno, aparecerá aquí con el resumen de su operación.'
                    : 'Prueba con otro nombre o limpia el campo de búsqueda.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 p-3 lg:grid-cols-2">
                {filteredShifts.map((shift) => {
                  const isSelected = shift.id === selectedShiftId
                  return (
                    <article
                      key={shift.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        isSelected
                          ? 'border-[#0067C0]/50 bg-[#0067C0]/[0.03] ring-1 ring-[#0067C0]/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {getInitials(shift.cashierName)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="truncate text-sm font-bold text-slate-900">
                              {shift.cashierName}
                            </h5>
                            <p className="mt-0.5 text-[11px] text-slate-500">Turno de cajero</p>
                          </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                            aria-hidden="true"
                          />
                          Abierta
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3">
                        <DetailValue label="Ventas netas" value={formatMoney(shift.totalSales)} />
                        <DetailValue
                          label="Efectivo esperado"
                          value={formatMoney(shift.expectedCash)}
                          emphasized
                        />
                        <DetailValue
                          label="Fondo inicial"
                          value={formatMoney(shift.openingAmount)}
                        />
                        <DetailValue
                          label="Tickets vigentes"
                          value={shift.ticketCount.toLocaleString('es-VE')}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={12} />
                          Apertura: {formatDate(shift.openedAt)}
                        </span>
                        <span>En turno: {getElapsedTime(shift.openedAt)}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] text-slate-500">
                          {isSelected
                            ? 'Caja actualmente seleccionada'
                            : 'Consulta de solo lectura'}
                        </span>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            onSelect(shift.id)
                            onClose()
                          }}
                          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 ${
                            isSelected
                              ? 'border border-[#0067C0]/25 bg-[#0067C0]/5 text-[#005A9E] hover:bg-[#0067C0]/10'
                              : 'bg-[#0067C0] text-white hover:bg-[#005A9E]'
                          }`}
                        >
                          {isSelected ? 'Caja seleccionada' : 'Ver detalle de caja'}
                        </button>
                      </div>
                    </article>
                  )
                })}
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
