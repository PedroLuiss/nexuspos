import React from 'react'
import { CartItem, PaymentDetails } from '../../../shared/types/domain'
import { Printer, X, Receipt } from '../../../shared/icons/Icons'

interface TicketPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment?: PaymentDetails
  ticketNumber: string
  cashierName: string
  customerName?: string
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  tax,
  discount,
  total,
  payment,
  ticketNumber,
  cashierName,
  customerName
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop">
      <div className="w-full max-w-sm bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-modal flex flex-col max-h-[90vh]">
        {/* Modal Window Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-[#0078D4]" />
            <h3 className="text-xs font-bold text-slate-800">
              Vista Previa Ticket Térmico 80mm
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Paper Receipt Simulation */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div className="w-72 bg-white p-4 shadow-md font-mono text-[11px] leading-relaxed text-slate-800 border-t-4 border-[#0078D4]">
            {/* Business Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <div className="font-extrabold text-sm tracking-wider">NEXUS MARKET S.A.</div>
              <div className="text-[10px] text-slate-500">RFC: NEX-980412-A10</div>
              <div className="text-[10px] text-slate-500">Av. Central #120, Col. Centro</div>
              <div className="text-[10px] text-slate-500">Tel: (55) 5555-0199</div>
            </div>

            {/* Ticket Info */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>TICKET #{ticketNumber}</span>
                <span>CAJA 01</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Fecha: {new Date().toLocaleDateString('es-MX')}</span>
                <span>{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-slate-600">Cajero: {cashierName}</div>
              {customerName && <div className="text-slate-600 font-bold">Cliente: {customerName}</div>}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-1">CANT DESCRIPCIÓN</th>
                    <th className="text-right pb-1">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.product.id}>
                      <td className="py-1">
                        <div className="font-bold line-clamp-1">{item.product.name}</div>
                        <div className="text-[9px] text-slate-500">
                          {item.quantity} x ${item.product.salePrice.toFixed(2)}
                          {item.discountPercent > 0 && ` (-${item.discountPercent}%)`}
                        </div>
                      </td>
                      <td className="text-right align-top py-1 font-bold">
                        ${(item.product.salePrice * item.quantity * (1 - item.discountPercent / 100)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuentos:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA Trasladado (16%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200">
                <span>TOTAL A PAGAR:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {payment && (
                <div className="pt-1 text-[10px] space-y-0.5 text-slate-600 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Método de Pago:</span>
                    <span className="uppercase font-bold">{payment.method}</span>
                  </div>
                  {payment.method === 'cash' && (
                    <>
                      <div className="flex justify-between">
                        <span>Efectivo Recibido:</span>
                        <span>${payment.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Cambio Entregado:</span>
                        <span>${payment.change.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Simulated Barcode */}
            <div className="pt-3 text-center">
              <div className="flex items-center justify-center h-8 gap-[2px]">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 4, 1, 2, 3, 1].map((w, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
              <div className="text-[9px] text-slate-400 mt-1 font-mono tracking-widest">
                *{ticketNumber}*
              </div>
              <div className="text-[9px] text-slate-500 mt-2 italic">
                ¡Gracias por su compra! Conserve este ticket para devoluciones.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#f8f9fa] border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              alert('Enviando ticket a impresora térmica USB (ESC/POS 80mm)...')
              onClose()
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-sm"
          >
            <Printer size={15} />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TicketPreviewModal
