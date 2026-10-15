import React from 'react'
import {
  ArrowRightLeft,
  Minus,
  Plus,
  QrCode,
  Wifi,
  Check
} from '../../../shared/icons/Icons'

interface StockBranchTransferFormProps {
  activeBranchName: string
  availableInSelected: number
  quantity: number
  onQuantityChange: (value: number) => void
  reason: string
  onReasonChange: (value: string) => void
  printQrTicket: boolean
  onPrintQrChange: (value: boolean) => void
  sendWsAlert: boolean
  onSendWsChange: (value: boolean) => void
  onClose: () => void
  onSubmit: () => void
}

export const StockBranchTransferForm: React.FC<StockBranchTransferFormProps> = ({
  activeBranchName,
  availableInSelected,
  quantity,
  onQuantityChange,
  reason,
  onReasonChange,
  printQrTicket,
  onPrintQrChange,
  sendWsAlert,
  onSendWsChange,
  onClose,
  onSubmit
}) => {
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F9F9F9] border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={15} className="text-[#0067C0]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B1B]">
            Generar Orden de Traslado Inter-Tienda desde:{' '}
            <span className="text-[#0067C0] font-mono">{activeBranchName}</span>
          </h3>
        </div>
        <span className="text-xs text-[#5C5C5C]">
          Stock disponible en origen:{' '}
          <strong className="font-mono text-[#107C41]">{availableInSelected} pzas</strong>
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
            Cantidad Requerida (Unidades)
          </label>
          <div className="flex items-center border border-[#D1D1D1] rounded-[4px] bg-white shadow-xs w-36">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-3 py-1.5 text-[#5C5C5C] hover:bg-[#F3F3F3] cursor-pointer"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              min="1"
              max={availableInSelected}
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 text-center font-bold font-mono text-xs border-x border-[#E5E5E5] py-1 text-[#1B1B1B]"
            />
            <button
              type="button"
              onClick={() => onQuantityChange(Math.min(availableInSelected, quantity + 1))}
              className="px-3 py-1.5 text-[#5C5C5C] hover:bg-[#F3F3F3] cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
            Motivo del Movimiento
          </label>
          <select
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-[#D1D1D1] rounded-[4px] font-medium text-[#1B1B1B]"
          >
            <option value="Reposición de Emergencia">Reposición de Emergencia</option>
            <option value="Venta en Mostrador">Venta en Mostrador Directa</option>
            <option value="Reserva de Cliente">Reserva Especial para Cliente</option>
            <option value="Balance de Inventario">Balance de Inventario Mensual</option>
          </select>
        </div>

        <div className="space-y-1.5 pt-2 md:pt-0">
          <label className="flex items-center gap-2 text-xs text-[#1B1B1B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={printQrTicket}
              onChange={(e) => onPrintQrChange(e.target.checked)}
              className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1]"
            />
            <span className="flex items-center gap-1">
              <QrCode size={13} className="text-[#0067C0]" />
              Imprimir Ticket de Reserva con QR
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#1B1B1B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendWsAlert}
              onChange={(e) => onSendWsChange(e.target.checked)}
              className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1]"
            />
            <span className="flex items-center gap-1">
              <Wifi size={13} className="text-[#107C41]" />
              Alerta sonora WebSocket en Terminal Origen
            </span>
          </label>
        </div>
      </div>

      <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#5C5C5C]">
          <span className="flex items-center gap-1">
            <span className="kbd-badge">ESC</span> Cerrar
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd-badge">F4</span> Buscar
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd-badge">F5</span> Refrescar
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
          >
            Cancelar [ESC]
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
          >
            <Check size={15} />
            <span>Confirmar Solicitud de Traslado</span>
            <span className="kbd-badge bg-white/20 text-white border-white/30 text-[10px]">
              F10 / ENTER
            </span>
          </button>
        </div>
      </div>
    </form>
  )
}

export default StockBranchTransferForm
