import React, { useState } from 'react'
import type { BusinessConfig, BusinessConfigInput } from '@shared/contracts'
import { X, Percent, Check, AlertCircle, ShieldAlert, Info } from '../../../shared/icons/Icons'

interface TaxSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  config: BusinessConfig
  canEdit: boolean
  onSave: (input: BusinessConfigInput) => Promise<void>
}

const TAX_PRESETS = [
  { name: 'IVA', rate: 16, help: 'Venezuela (tasa estándar)' },
  { name: 'IVA', rate: 8, help: 'Venezuela (tasa reducida)' },
  { name: 'IVA', rate: 0, help: 'Venezuela (exento)' }
]

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'

/** Configuración del impuesto al valor agregado (IVA / IGV / ITBMS) aplicado en caja. */
export const TaxSettingsModal: React.FC<TaxSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  canEdit,
  onSave
}) => {
  const [enabled, setEnabled] = useState(config.taxEnabled)
  const [name, setName] = useState(config.taxName)
  const [rate, setRate] = useState<number>(config.taxRate)
  const [pricesIncludeTax, setPricesIncludeTax] = useState(config.pricesIncludeTax)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const safeRate = Number.isFinite(rate) ? rate : 0
  const exampleBase = 100
  const exampleTax = enabled
    ? pricesIncludeTax
      ? exampleBase - exampleBase / (1 + safeRate / 100)
      : exampleBase * (safeRate / 100)
    : 0
  const exampleTotal = enabled && !pricesIncludeTax ? exampleBase + exampleTax : exampleBase

  const applyPreset = (preset: (typeof TAX_PRESETS)[number]): void => {
    setName(preset.name)
    setRate(preset.rate)
    setEnabled(true)
  }

  const handleSubmit = async (): Promise<void> => {
    if (!canEdit) return
    setErrorMsg(null)

    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setErrorMsg('La tasa debe ser un porcentaje entre 0 y 100.')
      return
    }
    if (enabled && !name.trim()) {
      setErrorMsg('Indique el nombre del impuesto (IVA, IGV, ITBMS…).')
      return
    }

    const input: BusinessConfig = { ...config }
    delete input.updatedAt
    delete input.updatedBy

    setIsSaving(true)
    try {
      await onSave({
        ...input,
        taxEnabled: enabled,
        taxName: name.trim() || 'IVA',
        taxRate: rate,
        pricesIncludeTax
      })
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la configuración de IVA.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-lg bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-amber-50 text-amber-700 flex items-center justify-center">
              <Percent size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Impuestos y Facturación
              </h2>
              <p className="text-[11px] text-[#717783]">
                Tasa aplicada por la terminal de ventas y el ticket · SQLite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {!canEdit && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldAlert size={13} className="text-slate-500" />
            <span>Modo lectura: solo el Administrador puede modificar la tasa de impuesto.</span>
          </div>
        )}

        {errorMsg && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <label
            className={`flex items-start gap-2 p-3 rounded-[6px] border ${
              enabled ? 'border-[#107C41] bg-emerald-50/60' : 'border-slate-200 bg-slate-50'
            } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#107C41] focus:ring-[#107C41]"
            />
            <span>
              <span className="block font-bold text-slate-900">
                Aplicar impuesto en las ventas
              </span>
              <span className="block text-[11px] text-slate-600">
                Al desactivarlo, el POS no traslada impuesto y el ticket omite la línea.
              </span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nombre del Impuesto
              </label>
              <input
                type="text"
                disabled={!canEdit || !enabled}
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                maxLength={20}
                placeholder="IVA"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tasa (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  disabled={!canEdit || !enabled}
                  value={Number.isFinite(rate) ? rate : 0}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className={`${inputClass} pr-7 font-mono text-right`}
                />
                <Percent
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          {canEdit && enabled && (
            <div className="flex flex-wrap gap-1.5">
              {TAX_PRESETS.map((preset) => (
                <button
                  key={`${preset.name}-${preset.rate}`}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 text-[10px] font-semibold rounded-full border border-slate-300 bg-white hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                  title={preset.help}
                >
                  {preset.name} {preset.rate}%
                </button>
              ))}
            </div>
          )}

          <label
            className={`flex items-start gap-2 p-3 rounded-[6px] border border-slate-200 bg-[#F9F9F9] ${
              canEdit && enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
            }`}
          >
            <input
              type="checkbox"
              disabled={!canEdit || !enabled}
              checked={pricesIncludeTax}
              onChange={(e) => setPricesIncludeTax(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#0067C0] focus:ring-[#0067C0]"
            />
            <span>
              <span className="block font-semibold text-slate-900">
                Los precios de venta ya incluyen impuesto
              </span>
              <span className="block text-[11px] text-slate-600">
                Actívalo si el precio del producto es el precio final al público. El impuesto se
                desagrega solo para el ticket y los reportes, sin sumarse al total.
              </span>
            </span>
          </label>

          <div className="bg-white border border-slate-200 rounded-[6px] p-3 space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
              <Info size={13} className="text-[#0067C0]" />
              <span>Simulación de una venta de Bs. {exampleBase.toFixed(2)}</span>
            </span>
            <div className="flex justify-between text-slate-600">
              <span>Base gravable:</span>
              <span className="font-mono">Bs. {exampleBase.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>
                {name || 'IVA'} ({safeRate}%):
              </span>
              <span className="font-mono">Bs. {exampleTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
              <span>Total a cobrar:</span>
              <span className="font-mono">Bs. {exampleTotal.toFixed(2)}</span>
            </div>
            {pricesIncludeTax && enabled && (
              <p className="text-[10px] text-slate-500">
                El precio ya contiene el impuesto: el cliente paga Bs. {exampleBase.toFixed(2)}.
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canEdit || isSaving}
            onClick={() => void handleSubmit()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Impuesto'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaxSettingsModal
