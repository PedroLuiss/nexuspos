import React, { useEffect, useState } from 'react'
import type { BusinessConfig, BusinessConfigInput } from '@shared/contracts'
import { formatTaxLabel, formatTaxRate } from '@shared/lib/tax'
import { useTaxes } from '../../../shared/hooks/useTaxes'
import { X, Percent, Check, AlertCircle, ShieldAlert, Info } from '../../../shared/icons/Icons'
import TaxCatalogEditor from './TaxCatalogEditor'

interface TaxSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  config: BusinessConfig
  canEdit: boolean
  onSave: (input: BusinessConfigInput) => Promise<void>
}

/**
 * Configuración fiscal de la terminal:
 * - Interruptor global de impuestos y modo "precios incluyen impuesto".
 * - Catálogo multi-tasa (exento, general, reducido, personalizadas).
 */
export const TaxSettingsModal: React.FC<TaxSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  canEdit,
  onSave
}) => {
  const {
    taxes,
    defaultTax,
    error: catalogError,
    isLoading,
    createTax,
    updateTax,
    deleteTax,
    setDefaultTax
  } = useTaxes()
  const [enabled, setEnabled] = useState(config.taxEnabled)
  const [pricesIncludeTax, setPricesIncludeTax] = useState(config.pricesIncludeTax)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const timerId = window.setTimeout(() => {
      setEnabled(config.taxEnabled)
      setPricesIncludeTax(config.pricesIncludeTax)
      setErrorMsg(null)
    }, 0)
    return () => window.clearTimeout(timerId)
  }, [isOpen, config.taxEnabled, config.pricesIncludeTax])

  if (!isOpen) return null

  const defaultRate = defaultTax?.rate ?? 0
  const defaultLabel = formatTaxLabel(defaultTax?.name ?? config.taxName, defaultRate)
  const exampleBase = 100
  const exampleTax = enabled
    ? pricesIncludeTax
      ? exampleBase - exampleBase / (1 + defaultRate / 100)
      : (exampleBase * defaultRate) / 100
    : 0
  const exampleTotal = enabled && !pricesIncludeTax ? exampleBase + exampleTax : exampleBase

  const handleSubmit = async (): Promise<void> => {
    if (!canEdit) return
    setErrorMsg(null)

    if (enabled && taxes.filter((tax) => tax.active).length === 0) {
      setErrorMsg('Cree al menos una tasa activa antes de aplicar impuestos en caja.')
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
        taxName: defaultTax?.name ?? config.taxName ?? 'IVA',
        taxRate: defaultRate,
        pricesIncludeTax
      })
      onClose()
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo guardar la configuración de impuestos.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-2xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[92vh]">
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
                Catálogo de alícuotas y reglas aplicadas por la terminal de ventas
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
            <span>Modo lectura: solo el Administrador puede modificar impuestos y alícuotas.</span>
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
              <span className="block font-bold text-slate-900">Aplicar impuesto en las ventas</span>
              <span className="block text-[11px] text-slate-600">
                Cada producto traslada su propia alícuota. Al desactivarlo, el POS no calcula
                impuesto y el ticket omite el desglose.
              </span>
            </span>
          </label>

          <TaxCatalogEditor
            taxes={taxes}
            canEdit={canEdit && !isLoading}
            error={catalogError}
            createTax={createTax}
            updateTax={updateTax}
            deleteTax={deleteTax}
            setDefaultTax={setDefaultTax}
          />

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
                desagrega por tasa para el ticket y los reportes, sin sumarse al total.
              </span>
            </span>
          </label>

          <div className="bg-white border border-slate-200 rounded-[6px] p-3 space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
              <Info size={13} className="text-[#0067C0]" />
              <span>Simulación con la tasa predeterminada</span>
            </span>
            <div className="flex justify-between text-slate-600">
              <span>Base gravable:</span>
              <span className="font-mono">${exampleBase.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{defaultLabel}:</span>
              <span className="font-mono">${exampleTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
              <span>Total a cobrar:</span>
              <span className="font-mono">${exampleTotal.toFixed(2)}</span>
            </div>
            {enabled && taxes.some((tax) => tax.active && tax.rate === 0) && (
              <p className="text-[10px] text-slate-500">
                Los productos exentos (0%) no trasladan impuesto y se reportan como base exenta.
              </p>
            )}
            {defaultTax && pricesIncludeTax && (
              <p className="text-[10px] text-slate-500">
                Precio final ${exampleBase.toFixed(2)} · impuesto desagregado{' '}
                {formatTaxRate(defaultRate)}: ${exampleTax.toFixed(2)}.
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500">
            Las tasas se guardan al instante; el interruptor global se aplica al guardar.
          </span>
          <div className="flex gap-2">
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
              <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaxSettingsModal
