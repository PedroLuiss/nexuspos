import React from 'react'
import { MapPin, PhoneCall } from '../../../shared/icons/Icons'
import type { BranchStockInfo } from './stockBranch.data'

interface StockBranchTableProps {
  branches: BranchStockInfo[]
  selectedBranchId: string
  onSelect: (id: string) => void
}

export const StockBranchTable: React.FC<StockBranchTableProps> = ({
  branches,
  selectedBranchId,
  onSelect
}) => {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold">
          <tr>
            <th className="py-2 px-3 text-left">Sucursal / Nodo</th>
            <th className="py-2 px-3 text-left">Tipo</th>
            <th className="py-2 px-3 text-left">Ubicación</th>
            <th className="py-2 px-3 text-center">Distancia</th>
            <th className="py-2 px-3 text-center">Stock Físico</th>
            <th className="py-2 px-3 text-center">Disponible</th>
            <th className="py-2 px-3 text-left">Contacto</th>
            <th className="py-2 px-3 text-center">Selección</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5E5]">
          {branches.map((b) => {
            const isSelected = b.id === selectedBranchId
            const available = Math.max(0, b.physicalStock - b.reservedStock)

            return (
              <tr
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]' : 'hover:bg-[#F9F9F9]'
                }`}
              >
                <td className="py-2 px-3 font-bold text-[#1B1B1B]">
                  <div className="flex items-center gap-1.5">
                    <span>{b.name}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#0067C0]"></span>}
                  </div>
                </td>

                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-[3px] border ${
                      b.type === 'Centro Logístico CEDI'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : b.type === 'En Tránsito'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-[#0067C0] border-blue-200'
                    }`}
                  >
                    {b.type}
                  </span>
                </td>

                <td className="py-2 px-3 text-[#5C5C5C]">
                  <div className="text-[11px] text-[#717783] truncate max-w-[200px]">
                    {b.address}
                  </div>
                </td>

                <td className="py-2 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 font-semibold text-[#1B1B1B]">
                    <MapPin size={12} className="text-[#0067C0]" />
                    <span>{b.distanceKm} km</span>
                  </div>
                </td>

                <td className="py-2 px-3 text-center font-mono font-bold text-[#1B1B1B]">
                  {b.physicalStock}
                </td>

                <td className="py-2 px-3 text-center">
                  <span
                    className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                      available > 20
                        ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                        : available > 0
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-red-50 text-[#C42B1C] border border-red-200'
                    }`}
                  >
                    {available}
                  </span>
                </td>

                <td className="py-2 px-3 text-[#5C5C5C]">
                  <div className="flex items-center gap-1 font-mono font-semibold text-[#1B1B1B]">
                    <PhoneCall size={12} className="text-[#107C41]" />
                    <span>{b.phoneExt}</span>
                  </div>
                  <div className="text-[11px] text-[#717783]">{b.contactName}</div>
                </td>

                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(b.id)
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0067C0] text-white shadow-xs'
                        : 'bg-white border border-[#D1D1D1] text-[#1B1B1B] hover:bg-[#F9F9F9]'
                    }`}
                  >
                    {isSelected ? 'Seleccionada' : 'Seleccionar'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default StockBranchTable
