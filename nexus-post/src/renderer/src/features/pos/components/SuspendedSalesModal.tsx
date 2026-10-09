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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop">
      <div className="w-full max-w-xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#f8f9fa] border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Ventas en Espera (Tickets Pausados)
              </h2>
              <p className="text-[11px] text-slate-500">
                Recupera un ticket previo para completar su cobro
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* List of Suspended Sales */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5">
          {suspendedSales.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">No hay ventas pausadas actualmente</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Puedes pausar cualquier venta en el POS con el botón [ALT+P]
              </p>
            </div>
          ) : (
            suspendedSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded flex items-center justify-between transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{sale.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      {sale.timestamp}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {sale.items.length} artículos en ticket:
                    <span className="text-slate-700 ml-1">
                      {sale.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-extrabold font-tabular text-[#0078D4]">
                      ${sale.total.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onResumeSale(sale)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded transition-colors"
                    >
                      <Play size={13} />
                      <span>Cargar a Caja</span>
                    </button>

                    <button
                      onClick={() => onDeleteSuspendedSale(sale.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        <div className="px-6 py-3 bg-[#f8f9fa] border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuspendedSalesModal
