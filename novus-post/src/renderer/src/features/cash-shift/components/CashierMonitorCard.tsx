import type { CashierMonitorEntry } from '@shared/contracts'
import { Clock3 } from '../../../shared/icons/Icons'
import { DetailValue } from './CashierOpenShiftMetrics'
import { formatCurrency } from '../../../shared/lib/currency'

interface CashierMonitorCardProps {
  cashier: CashierMonitorEntry
  selectedShiftId?: string
  disabled: boolean
  onSelect: (shiftId: string) => void
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

export function CashierMonitorCard({
  cashier,
  selectedShiftId,
  disabled,
  onSelect,
  onClose
}: CashierMonitorCardProps): React.JSX.Element {
  const shift = cashier.activeShift
  const isSelected = shift?.id === selectedShiftId
  const stationChanged = shift && shift.stationName !== cashier.stationName

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        isSelected
          ? 'border-[#0067C0]/50 bg-[#0067C0]/[0.03] ring-1 ring-[#0067C0]/10'
          : shift
            ? 'border-slate-200 bg-white hover:border-slate-300'
            : 'border-slate-200 bg-slate-50/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              shift ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {getInitials(cashier.cashierName)}
          </div>
          <div className="min-w-0">
            <h5 className="truncate text-sm font-bold text-slate-900">{cashier.cashierName}</h5>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#0067C0]">
              {cashier.stationName}
            </p>
            {stationChanged && (
              <p className="mt-0.5 truncate text-[10px] text-amber-700">
                Este turno inició como {shift.stationName}
              </p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${
            shift && !cashier.isActive
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : shift
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              shift && !cashier.isActive
                ? 'bg-amber-500'
                : shift
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
            }`}
            aria-hidden="true"
          />
          {shift ? (cashier.isActive ? 'Abierta' : 'Usuario inactivo') : 'Sin apertura'}
        </span>
      </div>

      {shift ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3">
            <DetailValue
              label="Ventas netas"
              value={formatCurrency(shift.totalSales, shift.currency)}
            />
            <DetailValue
              label="Efectivo esperado"
              value={formatCurrency(shift.expectedCash, shift.currency)}
              emphasized
            />
            <DetailValue
              label="Fondo inicial"
              value={formatCurrency(shift.openingAmount, shift.currency)}
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
        </>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-center">
          <p className="text-xs font-semibold text-slate-600">Turno pendiente</p>
          <p className="mt-1 text-[10px] text-slate-500">El cajero aún no ha abierto esta caja.</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[10px] text-slate-500">
          {!shift
            ? 'Disponible al iniciar un turno'
            : isSelected
              ? 'Caja actualmente seleccionada'
              : 'Consulta de solo lectura'}
        </span>
        <button
          type="button"
          disabled={disabled || !shift}
          onClick={() => {
            if (!shift) return
            onSelect(shift.id)
            onClose()
          }}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isSelected
              ? 'border border-[#0067C0]/25 bg-[#0067C0]/5 text-[#005A9E] hover:bg-[#0067C0]/10'
              : 'bg-[#0067C0] text-white hover:bg-[#005A9E]'
          }`}
        >
          {!shift ? 'Sin turno activo' : isSelected ? 'Caja seleccionada' : 'Ver detalle de caja'}
        </button>
      </div>
    </article>
  )
}
