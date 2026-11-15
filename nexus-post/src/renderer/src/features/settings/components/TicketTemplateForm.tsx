import React from 'react'
import type { BusinessConfigInput } from '@shared/contracts'

interface TicketTemplateFormProps {
  values: BusinessConfigInput
  onChange: (patch: Partial<BusinessConfigInput>) => void
  disabled?: boolean
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'
const labelClass = 'block text-[11px] font-semibold text-slate-700 mb-1'

const TOGGLES: { key: 'ticketShowTaxId' | 'ticketShowAddress' | 'ticketShowCashier'; label: string; help: string }[] = [
  {
    key: 'ticketShowTaxId',
    label: 'Mostrar RIF en el ticket',
    help: 'Imprime el RIF del negocio bajo el nombre comercial (requerido por el SENIAT).'
  },
  {
    key: 'ticketShowAddress',
    label: 'Mostrar domicilio fiscal',
    help: 'Imprime dirección, ciudad, estado y teléfono en el encabezado.'
  },
  {
    key: 'ticketShowCashier',
    label: 'Mostrar cajero en el ticket',
    help: 'Identifica al operador que realizó la venta.'
  }
]

/** Plantilla de impresión del ticket térmico (ENCABEZADO / PIE / LEYENDA LEGAL) para Venezuela. */
export const TicketTemplateForm: React.FC<TicketTemplateFormProps> = ({
  values,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Mensaje de Bienvenida (Encabezado)</label>
        <input
          type="text"
          disabled={disabled}
          value={values.ticketHeader}
          onChange={(e) => onChange({ ticketHeader: e.target.value })}
          placeholder="¡Bienvenidos a Nexus Market Venezuela!"
          maxLength={120}
          className={inputClass}
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Se imprime centrado debajo de la razón social. Máximo 120 caracteres.
        </p>
      </div>

      <div>
        <label className={labelClass}>Pie de Ticket (Agradecimiento / Políticas)</label>
        <textarea
          rows={3}
          disabled={disabled}
          value={values.ticketFooter}
          onChange={(e) => onChange({ ticketFooter: e.target.value })}
          maxLength={200}
          placeholder="Gracias por su compra. Conserve este ticket para cambios o devoluciones."
          className={`${inputClass} resize-none`}
        />
        <p className="text-[10px] text-slate-500 mt-1">
          {values.ticketFooter.length}/200 caracteres.
        </p>
      </div>

      <div>
        <label className={labelClass}>Leyenda Legal Obligatoria</label>
        <textarea
          rows={2}
          disabled={disabled}
          value={values.ticketLegalNote}
          onChange={(e) => onChange({ ticketLegalNote: e.target.value })}
          maxLength={200}
          placeholder="Documento no fiscal. RIF: J-00000000-0. Sujeto a regulación del SENIAT."
          className={`${inputClass} resize-none`}
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Leyenda impresa al pie del ticket térmico.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#0067C0]">
          Datos Visibles en el Ticket
        </span>
        <div className="grid grid-cols-1 gap-2 bg-[#F9F9F9] border border-slate-200 rounded-[6px] p-3">
          {TOGGLES.map((toggle) => (
            <label
              key={String(toggle.key)}
              className={`flex items-start gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(values[toggle.key])}
                onChange={(e) =>
                  onChange({ [toggle.key]: e.target.checked } as Partial<BusinessConfigInput>)
                }
                className="mt-0.5 rounded border-slate-300 text-[#0067C0] focus:ring-[#0067C0] disabled:opacity-50"
              />
              <span>
                <span className="block text-[11px] font-semibold text-slate-800">{toggle.label}</span>
                <span className="block text-[10px] text-slate-500">{toggle.help}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-[#F9F9F9] border border-slate-200 rounded-[6px] p-3 font-mono text-[10px] leading-relaxed text-slate-700">
        <div className="text-center font-bold">{values.legalName || 'RAZÓN SOCIAL'}</div>
        <div className="text-center text-xs text-slate-600">{values.tradeName || 'Nombre Comercial'}</div>
        {values.ticketShowTaxId && values.taxIdType !== 'NONE' && (
          <div className="text-center">
            RIF: {values.taxId || '—'}
          </div>
        )}
        {values.ticketShowAddress && values.address && (
          <div className="text-center text-xs">
            {values.address}
          </div>
        )}
        {values.ticketShowAddress && values.city && values.state && (
          <div className="text-center text-xs">
            {values.city}, {values.state} - {values.country || 'Venezuela'}
          </div>
        )}
        {values.ticketShowAddress && values.phone && (
          <div className="text-center text-xs">Tel: {values.phone}</div>
        )}
        <div className="text-center border-y border-dashed border-slate-300 my-1 py-0.5">
          {values.ticketHeader || 'Encabezado del ticket'}
        </div>
        <div className="text-center text-slate-500">— Detalle de la venta —</div>
        <div className="text-center border-t border-dashed border-slate-300 mt-1 pt-0.5">
          {values.ticketFooter || 'Gracias por su compra'}
        </div>
        {values.ticketLegalNote && (
          <div className="text-center text-[9px] text-slate-500 mt-0.5">{values.ticketLegalNote}</div>
        )}
      </div>
    </div>
  )
}

export default TicketTemplateForm
