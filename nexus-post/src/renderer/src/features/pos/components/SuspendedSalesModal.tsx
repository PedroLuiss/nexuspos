import React from 'react'
import { SuspendedSale } from '../../../shared/types/domain'
import { Clock, Play, Trash2, X, ShoppingCart } from '../../../shared/icons/Icons'

interface SuspendedSalesModalProps {
  isOpen: boolean
  suspendedSales: SuspendedSale[]
  onClose: () => void
  onResumeSale: (sale: SuspendedSale) => void
  onDeleteSuspendedSale: (id: string) => void
}

export const SuspendedSalesModal: React.FC<SuspendedSalesModalProps> = ({
  isOpen,
  suspendedSales,
  onClose,
  onResumeSale,
  onDeleteSuspendedSale
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Ventas en Espera (Tickets Pausados)
              </h2>
              <p className="text-[11px] text-[#717783]">
                Recupera un ticket previo para completar su cobro
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="kbd-badge">ESC</span>
            <button onClick={onClose} className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List of Suspended Sales */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5 bg-[#F3F3F3]">
          {suspendedSales.length === 0 ? (
            <div className="py-12 text-center text-[#717783] text-xs bg-white rounded-[6px] border border-[#E5E5E5] p-6 shadow-xs">
              <ShoppingCart size={32} className="mx-auto mb-2 text-[#717783]/60" />
              <p className="font-bold text-[#1B1B1B]">No hay ventas pausadas actualmente</p>
              <p className="text-[11px] text-[#717783] mt-1 flex items-center justify-center gap-1">
                <span>Puedes pausar cualquier venta activa en el POS presionando</span>
                <span className="kbd-badge text-[#0067C0] bg-[#EBF0F5] border-[#0067C0]/30">ALT+P</span>
              </p>
            </div>
          ) : (
            suspendedSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3 bg-white hover:bg-[#EBF0F5]/50 border border-[#E5E5E5] rounded-[6px] shadow-xs flex items-center justify-between transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#1B1B1B] text-xs">{sale.name}</span>
                    <span className="kbd-badge text-[10px] text-[#5C5C5C]">
                      {sale.timestamp}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#5C5C5C]">
                    {sale.items.length} artículos en ticket:
                    <span className="text-[#1B1B1B] font-medium ml-1">
                      {sale.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-extrabold font-tabular text-[#0067C0]">
                      ${sale.total.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onResumeSale(sale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] active:bg-[#005228] rounded-[4px] transition-colors cursor-pointer shadow-xs"
                    >
                      <Play size={13} />
                      <span>Cargar a Caja</span>
                    </button>

                    <button
                      onClick={() => onDeleteSuspendedSale(sale.id)}
                      className="p-1.5 text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Eliminar ticket pausado"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuspendedSalesModal
