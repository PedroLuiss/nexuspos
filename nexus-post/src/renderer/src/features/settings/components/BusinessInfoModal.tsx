import React, { useMemo, useState } from 'react'
import type { BusinessConfig, BusinessConfigInput } from '@shared/contracts'
import {
  X,
  Building2,
  Receipt,
  Check,
  AlertCircle,
  ShieldAlert,
  MapPin
} from '../../../shared/icons/Icons'
import BusinessIdentityForm from './BusinessIdentityForm'
import TicketTemplateForm from './TicketTemplateForm'

interface BusinessInfoModalProps {
  isOpen: boolean
  onClose: () => void
  config: BusinessConfig
  canEdit: boolean
  onSave: (input: BusinessConfigInput) => Promise<void>
}

type BusinessTab = 'identity' | 'ticket'

/** Convierte la configuración persistida en el formulario editable (sin auditoría). */
function toInput(config: BusinessConfig): BusinessConfigInput {
  const input: BusinessConfig = { ...config }
  delete input.updatedAt
  delete input.updatedBy
  return input
}

export const BusinessInfoModal: React.FC<BusinessInfoModalProps> = ({
  isOpen,
  onClose,
  config,
  canEdit,
  onSave
}) => {
  const [tab, setTab] = useState<BusinessTab>('identity')
  const [form, setForm] = useState<BusinessConfigInput>(() => toInput(config))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const initialSnapshot = useMemo(() => JSON.stringify(toInput(config)), [config])
  const isDirty = JSON.stringify(form) !== initialSnapshot

  if (!isOpen) return null

  const patch = (changes: Partial<BusinessConfigInput>): void => {
    setForm((prev) => ({ ...prev, ...changes }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!canEdit) return
    setErrorMsg(null)
    setIsSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la configuración.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: { id: BusinessTab; label: string; icon: React.ReactNode; hint: string }[] = [
    {
      id: 'identity',
      label: 'Negocio y Propietario',
      icon: <Building2 size={14} />,
      hint: 'Identidad fiscal, contacto y domicilio'
    },
    {
      id: 'ticket',
      label: 'Plantilla de Ticket',
      icon: <Receipt size={14} />,
      hint: 'Encabezado, pie y datos visibles'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-3xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#107C41]/10 text-[#107C41] flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Datos del Negocio y Plantilla de Ticket
              </h2>
              <p className="text-[11px] text-[#717783]">
                Información fiscal, propietario y formato del comprobante 80mm
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

        <div className="px-5 pt-3 flex gap-1.5 border-b border-[#E5E5E5] bg-white">
          {tabs.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-[4px] border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'border-[#107C41] text-[#107C41] bg-emerald-50/60'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
                title={item.hint}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {!canEdit && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldAlert size={13} className="text-slate-500" />
            <span>
              Modo lectura: solo el Administrador puede editar los datos fiscales del negocio.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          id="business-info-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 text-xs"
        >
          {tab === 'identity' ? (
            <BusinessIdentityForm values={form} onChange={patch} disabled={!canEdit} />
          ) : (
            <TicketTemplateForm values={form} onChange={patch} disabled={!canEdit} />
          )}
        </form>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <MapPin size={12} />
            {form.city || 'Ciudad'}, {form.country || 'País'} · {form.currency}
            {isDirty && <span className="text-amber-600 font-semibold">· cambios sin guardar</span>}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="business-info-form"
              disabled={!canEdit || isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessInfoModal
