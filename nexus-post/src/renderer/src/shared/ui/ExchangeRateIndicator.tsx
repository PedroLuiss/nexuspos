import React from 'react'
import type { UsdVesExchangeRate } from '@shared/contracts'
import { RefreshCw } from '../icons/Icons'
import { formatVesAmount } from '../lib/currency'

interface ExchangeRateIndicatorProps {
  rate: UsdVesExchangeRate | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

function getUpdatedAtLabel(updatedAt: string): string {
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return 'Fecha de actualización no disponible'

  const time = new Intl.DateTimeFormat('es-VE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

  if (date.toDateString() === new Date().toDateString()) return `Hoy · ${time}`

  const day = new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short'
  }).format(date)
  return `${day} · ${time}`
}

function getStatusLabel(
  rate: UsdVesExchangeRate | null,
  isLoading: boolean,
  error: string | null
): string {
  if (isLoading) return 'Actualizando…'
  if (error) return rate ? 'Actualización fallida' : 'Sin conexión'
  if (!rate) return 'No disponible'
  if (rate.isStale) return 'Desactualizada'
  return getUpdatedAtLabel(rate.updatedAt)
}

export function ExchangeRateIndicator({
  rate,
  isLoading,
  error,
  onRefresh
}: ExchangeRateIndicatorProps): React.JSX.Element {
  const statusLabel = getStatusLabel(rate, isLoading, error)
  const detail = error
    ? `${statusLabel}: ${error}`
    : rate?.isStale
      ? `${statusLabel}. Última actualización: ${getUpdatedAtLabel(rate.updatedAt)}`
      : statusLabel

  return (
    <section
      aria-label={`Tasa oficial USD del BCV: ${rate ? formatVesAmount(rate.rate) : statusLabel}`}
      aria-live="polite"
      title={detail}
      className="flex h-9 items-center gap-2 rounded border border-[#E5E5E5] bg-[#F9F9F9] px-2"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#5C5C5C]">
          <span>Tasa BCV</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              error || rate?.isStale ? 'bg-amber-500' : rate ? 'bg-[#107C41]' : 'bg-slate-400'
            }`}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-mono text-xs font-bold tabular-nums text-[#1B1B1B]">
            {rate
              ? formatVesAmount(rate.rate)
              : isLoading
                ? 'Consultando…'
                : error
                  ? 'Error BCV'
                  : 'Sin tasa'}
          </span>
          {rate && (
            <span className="text-[9px] text-[#717783]">
              {rate.isStale || error ? statusLabel : getUpdatedAtLabel(rate.updatedAt)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Actualizar tasa BCV"
        title="Actualizar tasa BCV"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#D1D1D1] bg-white text-[#0067C0] transition-colors hover:bg-blue-50 disabled:cursor-wait disabled:opacity-50"
      >
        <RefreshCw size={13} className={isLoading ? 'animate-spin' : undefined} />
      </button>
    </section>
  )
}
