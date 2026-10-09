import React, { useState, useMemo } from 'react'
import { KardexMovement, KardexMovementType, KardexReason } from '../../shared/types/domain'
import {
  ClipboardList,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  FileSpreadsheet
} from '../../shared/icons/Icons'

interface KardexViewProps {
  movements: KardexMovement[]
}

export const KardexView: React.FC<KardexViewProps> = ({ movements }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | KardexMovementType>('ALL')
  const [reasonFilter, setReasonFilter] = useState<'ALL' | KardexReason>('ALL')
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.responsibleUser.toLowerCase().includes(searchTerm.toLowerCase())

      const matchType = typeFilter === 'ALL' || m.type === typeFilter
      const matchReason = reasonFilter === 'ALL' || m.reason === reasonFilter

      return matchSearch && matchType && matchReason
    })
  }, [movements, searchTerm, typeFilter, reasonFilter])

  const totalIn = movements
    .filter((m) => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + m.quantity, 0)

  const totalOut = movements
    .filter((m) => m.type === 'SALIDA')
    .reduce((acc, m) => acc + m.quantity, 0)

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 bg-[#F3F3F3]">
      {/* Top Banner & KPI Summary Cards (Fluent POS Engine Layer 100) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="text-[#5C5C5C] text-xs font-semibold uppercase tracking-wider">Movimientos Auditados</div>
          <div className="text-2xl font-bold font-mono text-[#1B1B1B] mt-1">
            {movements.length}
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">Rastro inmutable en base local</div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="text-[#107C41] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <ArrowDownLeft size={14} />
            <span>Entradas Totales</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#107C41] mt-1">
            +{totalIn} pzas
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">Compras y ajustes positivos</div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="text-[#C42B1C] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight size={14} />
            <span>Salidas Totales</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#C42B1C] mt-1">
            -{totalOut} pzas
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">Ventas, mermas y ajustes</div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="text-[#0067C0] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Layers size={14} />
            <span>Balance Neto</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#0067C0] mt-1">
            {totalIn - totalOut > 0 ? `+${totalIn - totalOut}` : totalIn - totalOut} pzas
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">Flujo acumulado del período</div>
        </div>
      </div>

      {/* Toolbar & Filters (Fluent Command Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-sm">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]"
          />
          <input
            type="text"
            placeholder="Buscar por producto, código o usuario [F3]..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] text-[#1B1B1B]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'ALL' | KardexMovementType)}
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="ENTRADA">Solo Entradas (+)</option>
            <option value="SALIDA">Solo Salidas (-)</option>
          </select>

          {/* Motivo */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value as 'ALL' | KardexReason)}
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todos los Motivos</option>
            <option value="VENTA">Venta en Caja</option>
            <option value="ENTRADA_MASIVA">Entrada Masiva</option>
            <option value="SALIDA_AJUSTE">Salida por Ajuste</option>
            <option value="MERMA">Merma / Daño</option>
            <option value="DEVOLUCION">Devolución</option>
            <option value="INVENTARIO_INICIAL">Inventario Inicial</option>
          </select>

          <button
            onClick={() => alert('Exportando reporte Kardex a formato Excel/CSV...')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-[#107C41]" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Main Immutable Audit Ledger Table */}
      <div className="flex-1 overflow-hidden bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold text-[11px] uppercase tracking-wider select-none shadow-xs">
              <tr>
                <th className="py-2.5 px-3 w-36">FECHA & HORA</th>
                <th className="py-2.5 px-3 w-28">CÓDIGO</th>
                <th className="py-2.5 px-3">PRODUCTO</th>
                <th className="py-2.5 px-3 text-center w-28">TIPO</th>
                <th className="py-2.5 px-3 w-36">MOTIVO</th>
                <th className="py-2.5 px-3 text-right w-24">STOCK ANTERIOR</th>
                <th className="py-2.5 px-3 text-right w-24">CANTIDAD</th>
                <th className="py-2.5 px-3 text-right w-24">STOCK FINAL</th>
                <th className="py-2.5 px-3 text-center w-32">USUARIO</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-[#717783]">
                    <ClipboardList size={40} className="mx-auto mb-2 text-[#D1D1D1]" />
                    <p className="text-xs font-semibold text-[#1B1B1B]">No se encontraron movimientos registrados en Kardex</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isEntry = mov.type === 'ENTRADA'
                  const isSelected = selectedRowId === mov.id

                  return (
                    <tr
                      key={mov.id}
                      onClick={() => setSelectedRowId(mov.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]'
                          : 'even:bg-[#FDFDFD] hover:bg-[#F9F9F9]'
                      }`}
                      style={{ height: '40px' }}
                    >
                      {/* Fecha */}
                      <td className="py-2 px-3 font-mono text-[11px] text-[#5C5C5C]">
                        {mov.timestamp}
                      </td>

                      {/* Código */}
                      <td className="py-2 px-3 font-mono text-xs font-semibold text-[#1B1B1B]">
                        {mov.productCode}
                      </td>

                      {/* Producto */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-xs text-[#1B1B1B]">{mov.productName}</div>
                        {mov.notes && (
                          <div className="text-[10px] text-[#717783] italic truncate max-w-sm">
                            {mov.notes}
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isEntry
                              ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                              : 'bg-red-50 text-[#C42B1C] border border-red-200'
                          }`}
                        >
                          {isEntry ? '+' : '-'} {mov.type}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="py-2 px-3">
                        <span className="font-semibold text-xs text-[#5C5C5C]">
                          {mov.reason.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Stock Anterior */}
                      <td className="py-2 px-3 text-right font-mono font-medium text-xs text-[#5C5C5C]">
                        {mov.previousStock}
                      </td>

                      {/* Cantidad */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-xs">
                        <span className={isEntry ? 'text-[#107C41]' : 'text-[#C42B1C]'}>
                          {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                      </td>

                      {/* Stock Final */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-xs text-[#1B1B1B]">
                        {mov.finalStock ?? mov.newStock}
                      </td>

                      {/* Usuario */}
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-medium bg-[#F3F3F3] text-[#5C5C5C] border border-[#E5E5E5]">
                          {mov.responsibleUser}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Subfooter */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F9F9F9] border-t border-[#E5E5E5] text-xs text-[#5C5C5C]">
          <span>
            Registros mostrados: <strong className="text-[#1B1B1B] font-mono">{filteredMovements.length}</strong> de {movements.length}
          </span>
          <span className="text-[11px] text-[#717783]">
            Auditoría de inventario garantizada por base de datos SQLite local
          </span>
        </div>
      </div>
    </div>
  )
}

export default KardexView
