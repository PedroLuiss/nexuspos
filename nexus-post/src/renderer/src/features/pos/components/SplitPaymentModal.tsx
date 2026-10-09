import React, { useState } from 'react'
import { Banknote, CreditCard, Layers, X, Check, AlertCircle } from '../../../shared/icons/Icons'

interface SplitPaymentModalProps {
  isOpen: boolean
  total: number
  onClose: () => void
  onConfirmSplit: (cashAmount: number, cardAmount: number) => void
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  total,
  onClose,
  onConfirmSplit
}) => {
  const [cashAmount, setCashAmount] = useState<number>(Math.floor(total / 2))
  const [cardAuth, setCardAuth] = useState('')

  if (!isOpen) return null

  const cardRemainder = Math.max(0, total - cashAmount)
  const isComplete = cashAmount + cardRemainder === total && total > 0

  const handleConfirm = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!isComplete) return
    onConfirmSplit(cashAmount, cardRemainder)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop">
      <div className="w-full max-w-md bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-modal">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#f8f9fa] border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0078D4]/10 text-[#0078D4] flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Dividir Pago (Pago Mixto)</h3>
              <p className="text-[11px] text-slate-500">
                Fraccionar cobro entre Efectivo y Tarjeta Bancaria
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Total to pay banner */}
        <div className="bg-[#0078D4]/5 border-b border-[#0078D4]/10 p-4 text-center">
          <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
            Total a Cubrir
          </span>
          <div className="text-3xl font-extrabold font-tabular text-[#0078D4]">
            ${total.toFixed(2)}
          </div>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="p-5 space-y-4 text-xs">
            {/* Cash portion */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Banknote size={15} className="text-emerald-600" />
                  Monto en Efectivo ($)
                </span>
                <button
                  type="button"
                  onClick={() => setCashAmount(Math.floor(total / 2))}
                  className="text-[11px] text-[#0078D4] hover:underline"
                >
                  50% / 50%
                </button>
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                max={total}
                required
                autoFocus
                value={cashAmount || ''}
                onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-lg font-bold font-tabular bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
              />
            </div>

            {/* Card portion (Calculated auto) */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-blue-600" />
                  Restante en Tarjeta / Terminal ($)
                </span>
                <span className="text-[10px] text-slate-400">Calculado automáticamente</span>
              </div>

              <div className="px-3 py-2 bg-slate-200/70 border border-slate-300 rounded-sm font-bold font-tabular text-lg text-blue-700">
                ${cardRemainder.toFixed(2)}
              </div>
            </div>

            {/* Sum check */}
            <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Check size={14} /> Total distribuido:
              </span>
              <span className="font-tabular font-bold">
                ${(cashAmount + cardRemainder).toFixed(2)} de ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="px-5 py-3.5 bg-[#f8f9fa] border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-sm"
            >
              <Check size={15} />
              <span>Confirmar Pago Mixto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SplitPaymentModal
