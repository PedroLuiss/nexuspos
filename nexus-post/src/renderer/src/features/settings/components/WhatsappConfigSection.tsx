import React from 'react'
import type { BusinessConfigInput } from '@shared/contracts'
import { MessageSquare, MessageCircle, Sparkles } from '../../../shared/icons/Icons'

interface WhatsappConfigSectionProps {
  values: BusinessConfigInput
  onChange: (patch: Partial<BusinessConfigInput>) => void
  disabled?: boolean
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'
const labelClass = 'block text-[11px] font-semibold text-slate-700 mb-1'

export const WhatsappConfigSection: React.FC<WhatsappConfigSectionProps> = ({
  values,
  onChange,
  disabled = false
}) => {
  const isEnabled = Boolean(values.whatsappInvoiceEnabled)

  const businessName = values.tradeName || values.legalName || 'NexusPOS'
  const template =
    values.whatsappMessageTemplate ||
    '¡Hola {cliente}! Le saludamos de {empresa}. Su factura #{numero} por un total de {total} ha sido emitida exitosamente. ¡Gracias por su compra!'

  const simulatedMessage = template
    .replace(/\{cliente\}/gi, 'Juan Pérez')
    .replace(/\{empresa\}/gi, businessName)
    .replace(/\{numero\}/gi, 'FAC-00128')
    .replace(/\{total\}/gi, 'Bs. 1.250,00')

  return (
    <div className="space-y-4">
      {/* Activador principal */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={disabled}
            checked={isEnabled}
            onChange={(e) => onChange({ whatsappInvoiceEnabled: e.target.checked })}
            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MessageCircle size={15} className="text-emerald-600" />
              Habilitar envío de facturas por WhatsApp
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Genera automáticamente el mensaje y enlace directo (wa.me) para enviar la factura digital a los clientes con número telefónico registrado.
            </span>
          </div>
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-4 p-4 bg-white border border-slate-200 rounded-md">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>Plantilla de Mensaje de WhatsApp</label>
              <span className="text-[10px] text-slate-400">
                Variables: {'{cliente}'}, {'{empresa}'}, {'{numero}'}, {'{total}'}
              </span>
            </div>
            <textarea
              rows={4}
              disabled={disabled}
              value={values.whatsappMessageTemplate || ''}
              onChange={(e) => onChange({ whatsappMessageTemplate: e.target.value })}
              placeholder="¡Hola {cliente}! Le saludamos de {empresa}. Su factura #{numero} por un total de {total} ha sido emitida..."
              className={`${inputClass} resize-none`}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Este mensaje se cargará automáticamente al presionar el botón de WhatsApp en la pantalla de cobro o en la vista previa del ticket.
            </p>
          </div>

          {/* Vista previa simulada de WhatsApp */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
              <Sparkles size={13} className="text-emerald-600" />
              <span>Vista previa del mensaje (Simulación):</span>
            </div>

            <div className="bg-[#EFEAE2] p-3 rounded-lg border border-slate-300 max-w-md">
              <div className="bg-white p-2.5 rounded-lg shadow-xs text-xs text-slate-800 relative space-y-1">
                <div className="text-[10px] font-bold text-emerald-700 mb-0.5">
                  {businessName} (Tu Negocio)
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{simulatedMessage}</div>
                <div className="text-right text-[9px] text-slate-400 mt-1">
                  {new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatsappConfigSection
