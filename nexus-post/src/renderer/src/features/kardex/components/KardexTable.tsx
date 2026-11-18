import React, { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { KardexMovement, KardexMovementPage, KardexMovementQuery } from '@shared/contracts'
import { ClipboardList } from '../../../shared/icons/Icons'

interface KardexTableProps {
  data: KardexMovementPage
  query: KardexMovementQuery
  onQueryChange: Dispatch<SetStateAction<KardexMovementQuery>>
  isLoading: boolean
}

const sourceLabels: Record<KardexMovement['source'], string> = {
  INVENTORY: 'Inventario',
  POS: 'Venta POS',
  CASH: 'Caja / devolución',
  LEGACY: 'Histórico'
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('es-VE', { maximumFractionDigits: 3 }).format(value)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'medium' })
}

function valuationLabel(basis: KardexMovement['valuationBasis']): string {
  if (basis === 'SALE_SNAPSHOT') return 'Costo histórico del ticket'
  if (basis === 'PRODUCT_COST') return 'Costo de ficha (referencial)'
  return 'Sin valoración histórica'
}

export const KardexTable: React.FC<KardexTableProps> = ({
  data,
  query,
  onQueryChange,
  isLoading
}) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[4px] border border-[#E5E5E5] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1450px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-[#E5E5E5] bg-[#F9F9F9] text-[10px] font-semibold uppercase tracking-wider text-[#1B1B1B] shadow-xs">
            <tr>
              <th className="w-36 px-3 py-2.5">Fecha y hora</th>
              <th className="w-32 px-3 py-2.5">Referencia</th>
              <th className="px-3 py-2.5">Producto</th>
              <th className="w-32 px-3 py-2.5">Origen</th>
              <th className="w-36 px-3 py-2.5">Tipo / motivo</th>
              <th className="w-32 px-3 py-2.5">Lote</th>
              <th className="w-24 px-3 py-2.5 text-right">Stock previo</th>
              <th className="w-24 px-3 py-2.5 text-right">Cambio</th>
              <th className="w-24 px-3 py-2.5 text-right">Stock final</th>
              <th className="w-28 px-3 py-2.5 text-right">Costo unit. USD</th>
              <th className="w-28 px-3 py-2.5 text-right">Costo total USD</th>
              <th className="w-32 px-3 py-2.5">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-20 text-center text-[#717783]">
                  <ClipboardList size={40} className="mx-auto mb-2 text-[#D1D1D1]" />
                  <p className="text-xs font-semibold text-[#1B1B1B]">
                    {isLoading
                      ? 'Cargando movimientos desde la base de datos...'
                      : 'No se encontraron movimientos para estos filtros.'}
                  </p>
                </td>
              </tr>
            ) : (
              data.items.map((movement) => {
                const isEntry = movement.type === 'ENTRADA'
                const isSelected = selectedRowId === movement.id
                const movementValue =
                  movement.unitCost === undefined
                    ? undefined
                    : movement.quantity * movement.unitCost

                return (
                  <React.Fragment key={movement.id}>
                    <tr
                      aria-expanded={isSelected}
                      onClick={() => setSelectedRowId(isSelected ? null : movement.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-l-4 border-l-[#0067C0] bg-[#EBF0F5]'
                          : 'even:bg-[#FDFDFD] hover:bg-[#F9F9F9]'
                      }`}
                      style={{ height: '48px' }}
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-[#5C5C5C]">
                        {formatTimestamp(movement.timestamp)}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[#0067C0]">
                        {movement.reference ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-xs text-[#1B1B1B]">
                          {movement.productName}
                        </div>
                        <div className="text-[10px] text-[#717783]">
                          {movement.productCode} · {movement.unit ?? 'unidad no registrada'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[#5C5C5C]">{sourceLabels[movement.source]}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isEntry
                              ? 'border-emerald-200 bg-emerald-50 text-[#107C41]'
                              : 'border-red-200 bg-red-50 text-[#C42B1C]'
                          }`}
                        >
                          {isEntry ? '+' : '−'} {movement.type}
                        </span>
                        <div className="mt-0.5 text-[10px] text-[#717783]">
                          {movement.reason.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#5C5C5C]">
                        {movement.batchNumber ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[#5C5C5C]">
                        {formatQuantity(movement.previousStock)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        <span className={isEntry ? 'text-[#107C41]' : 'text-[#C42B1C]'}>
                          {isEntry ? '+' : '−'}
                          {formatQuantity(movement.quantity)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[#1B1B1B]">
                        {formatQuantity(movement.newStock)} {movement.unit ?? ''}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[#5C5C5C]">
                        {movement.unitCost === undefined ? '—' : formatMoney(movement.unitCost)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-[#1B1B1B]">
                        {movementValue === undefined ? '—' : formatMoney(movementValue)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-[2px] border border-[#E5E5E5] bg-[#F3F3F3] px-2 py-0.5 text-[10px] font-medium text-[#5C5C5C]">
                          {movement.responsibleUser}
                        </span>
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className="bg-[#F7FAFC]">
                        <td colSpan={12} className="px-4 py-3 text-[11px] text-[#5C5C5C]">
                          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
                            <span>
                              <strong>ID de movimiento:</strong> {movement.id}
                            </span>
                            <span>
                              <strong>Valoración:</strong> {valuationLabel(movement.valuationBasis)}
                            </span>
                            <span>
                              <strong>Referencia:</strong> {movement.reference ?? 'No registrada'}
                            </span>
                            <span>
                              <strong>Unidad:</strong> {movement.unit ?? 'No registrada'}
                            </span>
                            <span className="sm:col-span-2 xl:col-span-4">
                              <strong>Notas:</strong> {movement.notes ?? 'Sin notas adicionales'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2 text-xs text-[#5C5C5C]">
        <span>
          {data.total === 0
            ? 'Sin registros'
            : `Mostrando ${(data.page - 1) * data.pageSize + 1}–${Math.min(
                data.page * data.pageSize,
                data.total
              )} de ${data.total.toLocaleString('es-VE')}`}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            Filas
            <select
              value={query.pageSize}
              onChange={(event) =>
                onQueryChange((current) => ({
                  ...current,
                  pageSize: Number(event.target.value),
                  page: 1
                }))
              }
              className="rounded border border-[#D1D1D1] bg-white px-1.5 py-1 text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button
            type="button"
            disabled={isLoading || data.page <= 1}
            onClick={() =>
              onQueryChange((current) => ({ ...current, page: Math.max(1, data.page - 1) }))
            }
            className="rounded border border-[#D1D1D1] bg-white px-2 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {data.page} de {data.totalPages}
          </span>
          <button
            type="button"
            disabled={isLoading || data.page >= data.totalPages}
            onClick={() =>
              onQueryChange((current) => ({
                ...current,
                page: Math.min(data.totalPages, data.page + 1)
              }))
            }
            className="rounded border border-[#D1D1D1] bg-white px-2 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
        <span className="text-[11px] text-[#717783]">Historial inmutable · Base SQLite local</span>
      </div>
    </div>
  )
}
