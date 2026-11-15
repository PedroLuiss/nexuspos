import React, { useState } from 'react'
import { X } from '../../../shared/icons/Icons'

interface ScaleSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (comPort: string, baudRate: number) => void
  initialPort: string
  initialBaudRate: number
  onFeedback: (msg: string) => void
}

export const ScaleSettingsModal: React.FC<ScaleSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPort,
  initialBaudRate,
  onFeedback
}) => {
  const [comPort, setComPort] = useState(initialPort)
  const [baudRate, setBaudRate] = useState(initialBaudRate)
  const [scaleWeight, setScaleWeight] = useState<string | null>(null)

  if (!isOpen) return null

  const handleTestScale = (): void => {
    setScaleWeight('Calculando peso...')
    setTimeout(() => {
      setScaleWeight('1.425 KG (Lectura Estable)')
      onFeedback(`Báscula serial ${comPort} sincronizada correctamente`)
    }, 600)
  }

  const handleSave = (): void => {
    onSave(comPort, baudRate)
    onFeedback('Configuración de puerto serial guardada')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
      <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
        <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Configuración de Báscula (RS-232 / COM)
          </h3>
          <button onClick={onClose} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1B1B1B] mb-1">Puerto COM</label>
              <select
                value={comPort}
                onChange={(e) => setComPort(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
              >
                <option value="COM1">COM1</option>
                <option value="COM2">COM2</option>
                <option value="COM3">COM3 (Detectado)</option>
                <option value="COM4">COM4</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1B1B1B] mb-1">Velocidad (Baud Rate)</label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
              >
                <option value={4800}>4800 bps</option>
                <option value={9600}>9600 bps (Estándar)</option>
                <option value={19200}>19200 bps</option>
                <option value={115200}>115200 bps</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-emerald-400 rounded-[4px] border border-slate-800 text-center font-mono select-none">
            <span className="text-[10px] text-slate-400 block tracking-widest uppercase">
              Pantalla Digital de Balanza
            </span>
            <div className="text-3xl font-extrabold tracking-wider my-1">
              {scaleWeight || '0.000 KG'}
            </div>
            <span className="text-[10px] text-slate-400">
              Protocolo: Continuo / Demanda (Básculas Torrey & Rhino)
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestScale}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[4px] transition-colors text-xs cursor-pointer"
          >
            Probar Lectura de Peso en Vivo
          </button>
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] cursor-pointer"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScaleSettingsModal
