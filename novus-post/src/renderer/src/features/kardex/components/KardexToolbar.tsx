import React, { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type {
  KardexExportFormat,
  KardexMovementQuery,
  KardexPeriod,
  KardexReason
} from '@shared/contracts'
import { getKardexPeriodRange } from '@shared/lib/kardex-period'
import { FileSpreadsheet, RefreshCw, Search } from '../../../shared/icons/Icons'
import { KardexExportDialog } from './KardexExportDialog'

interface KardexToolbarProps {
  query: KardexMovementQuery
  onQueryChange: Dispatch<SetStateAction<KardexMovementQuery>>
  isLoading: boolean
  onRefresh: () => void
  onExport: (format: KardexExportFormat) => Promise<boolean>
}

export const KardexToolbar: React.FC<KardexToolbarProps> = ({
  query,
  onQueryChange,
  isLoading,
  onRefresh,
  onExport
}) => {
  const [searchText, setSearchText] = useState(query.search)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  useEffect(() => {
    if (searchText === query.search) return
    const timer = window.setTimeout(() => {
      onQueryChange((current) => ({ ...current, search: searchText, page: 1 }))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [onQueryChange, query.search, searchText])

  const updatePeriod = (period: KardexPeriod): void => {
    onQueryChange((current) => ({
      ...current,
      period,
      ...getKardexPeriodRange(period),
      page: 1
    }))
  }

  const updateType = (type: KardexMovementQuery['type']): void => {
    onQueryChange((current) => ({ ...current, type, page: 1 }))
  }

  const updateReason = (reason: KardexReason | 'ALL'): void => {
    onQueryChange((current) => ({ ...current, reason, page: 1 }))
  }

  const openExportDialog = (): void => {
    if (searchText !== query.search) {
      onQueryChange((current) => ({ ...current, search: searchText, page: 1 }))
    }
    setIsExportDialogOpen(true)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-[#E5E5E5] bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]" />
          <input
            type="search"
            placeholder="Buscar producto, código, ticket, lote o usuario..."
            maxLength={120}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full rounded-[4px] border border-[#D1D1D1] bg-[#F9F9F9] py-1.5 pl-8 pr-3 text-xs text-[#1B1B1B] focus:border-[#0067C0] focus:bg-white focus:ring-1 focus:ring-[#0067C0]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Período del Kardex"
            value={query.period}
            onChange={(event) => updatePeriod(event.target.value as KardexPeriod)}
            className="rounded-[4px] border border-[#D1D1D1] bg-[#F9F9F9] px-2.5 py-1.5 text-xs font-medium text-[#1B1B1B]"
          >
            <option value="WEEK">Semana actual (lun-dom)</option>
            <option value="MONTH">
              Mes actual (
              {new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })})
            </option>
            <option value="YEAR">Año actual</option>
            <option value="ALL">Todo el historial</option>
          </select>

          <select
            aria-label="Tipo de movimiento"
            value={query.type}
            onChange={(event) => updateType(event.target.value as KardexMovementQuery['type'])}
            className="rounded-[4px] border border-[#D1D1D1] bg-[#F9F9F9] px-2.5 py-1.5 text-xs font-medium text-[#1B1B1B]"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </select>

          <select
            aria-label="Motivo del movimiento"
            value={query.reason}
            onChange={(event) => updateReason(event.target.value as KardexReason | 'ALL')}
            className="rounded-[4px] border border-[#D1D1D1] bg-[#F9F9F9] px-2.5 py-1.5 text-xs font-medium text-[#1B1B1B]"
          >
            <option value="ALL">Todos los motivos</option>
            <option value="VENTA">Venta en caja</option>
            <option value="COMBO">Venta de combo</option>
            <option value="ENTRADA_MASIVA">Entrada masiva</option>
            <option value="SALIDA_AJUSTE">Salida por ajuste</option>
            <option value="MERMA">Merma / daño</option>
            <option value="DEVOLUCION">Devolución</option>
            <option value="INVENTARIO_INICIAL">Inventario inicial</option>
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] transition-colors hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={openExportDialog}
            className="flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] transition-colors hover:bg-[#F9F9F9]"
          >
            <FileSpreadsheet size={14} className="text-[#107C41]" />
            Exportar
          </button>
        </div>
      </div>
      {isExportDialogOpen && (
        <KardexExportDialog
          query={query}
          onClose={() => setIsExportDialogOpen(false)}
          onExport={onExport}
        />
      )}
    </>
  )
}
