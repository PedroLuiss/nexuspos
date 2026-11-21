import React from 'react'
import type { KardexMovementSummary } from '@shared/contracts'
import { ArrowDownLeft, ArrowUpRight, Layers } from '../../../shared/icons/Icons'

interface KardexSummaryProps {
  summary: KardexMovementSummary
}

function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('es-VE', { maximumFractionDigits: 3 }).format(quantity)
}

function summarizeUnits(rows: KardexMovementSummary['entriesByUnit']): string {
  if (!rows.length) return 'Sin cantidades registradas'
  const quantities = rows
    .slice(0, 3)
    .map((row) => `${formatQuantity(row.quantity)} ${row.unit}`)
    .join(' · ')
  const remaining = rows.length > 3 ? ` · +${rows.length - 3} unidades` : ''
  return `${quantities}${remaining}`
}

export const KardexSummary: React.FC<KardexSummaryProps> = ({ summary }) => (
  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-[4px] border border-[#E5E5E5] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="text-xs font-semibold uppercase tracking-wider text-[#5C5C5C]">
        Movimientos del período
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-[#1B1B1B]">
        {summary.total.toLocaleString('es-VE')}
      </div>
      <div className="mt-0.5 text-[11px] text-[#717783]">Registros encontrados en el filtro</div>
    </div>

    <div className="rounded-[4px] border border-[#E5E5E5] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#107C41]">
        <ArrowDownLeft size={14} />
        Entradas
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-[#107C41]">
        {summary.entryMovements.toLocaleString('es-VE')}
      </div>
      <div className="mt-0.5 text-[11px] text-[#717783]">
        {summarizeUnits(summary.entriesByUnit)}
      </div>
    </div>

    <div className="rounded-[4px] border border-[#E5E5E5] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#C42B1C]">
        <ArrowUpRight size={14} />
        Salidas
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-[#C42B1C]">
        {summary.exitMovements.toLocaleString('es-VE')}
      </div>
      <div className="mt-0.5 text-[11px] text-[#717783]">{summarizeUnits(summary.exitsByUnit)}</div>
    </div>

    <div className="rounded-[4px] border border-[#E5E5E5] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#0067C0]">
        <Layers size={14} />
        Productos afectados
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-[#0067C0]">
        {summary.distinctProducts.toLocaleString('es-VE')}
      </div>
      <div className="mt-0.5 text-[11px] text-[#717783]">Sin mezclar unidades incompatibles</div>
    </div>
  </div>
)
