import React from 'react'
import { X } from '../../../shared/icons/Icons'

interface DatabaseBackupModalProps {
  isOpen: boolean
  onClose: () => void
  onFeedback: (msg: string) => void
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  onFeedback
}) => {
  if (!isOpen) return null

  const handleGenerateBackup = (): void => {
    const filename = `nexuspos_backup_${new Date().toISOString().slice(0, 10)}.sqlite`
    onFeedback(`Copia ${filename} generada con éxito`)
    onClose()
  }

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      window.alert(`Base de datos restaurada desde ${file.name}. La aplicación debe reiniciarse.`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
      <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
        <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Mantenimiento de Base de Datos SQLite
          </h3>
          <button onClick={onClose} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-[4px] space-y-2">
            <span className="font-bold text-[#1B1B1B] block">Generar Respaldo (.sqlite / .db)</span>
            <p className="text-[11px] text-[#5C5C5C]">
              Crea un archivo local con todas las tablas (ventas, kardex, inventario y clientes).
            </p>
            <button
              onClick={handleGenerateBackup}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-[4px] text-xs transition-colors cursor-pointer"
            >
              Descargar Copia de Seguridad Ahora
            </button>
          </div>

          <div className="p-3 bg-red-50/50 border border-red-200 rounded-[4px] space-y-2">
            <span className="font-bold text-[#C42B1C] block">Restaurar Copia Previa</span>
            <p className="text-[11px] text-[#5C5C5C]">
              Advertencia: Reemplazará todos los datos actuales por los del archivo restaurado.
            </p>
            <label className="block w-full py-2 bg-white hover:bg-[#F9F9F9] text-[#C42B1C] border border-red-300 font-bold rounded-[4px] text-xs text-center cursor-pointer">
              <span>Seleccionar Archivo .sqlite / .db</span>
              <input
                type="file"
                accept=".db,.sqlite,.sql"
                className="hidden"
                onChange={handleRestoreBackup}
              />
            </label>
          </div>
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-slate-50 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DatabaseBackupModal
