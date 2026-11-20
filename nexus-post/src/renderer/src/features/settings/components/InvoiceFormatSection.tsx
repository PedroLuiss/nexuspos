import React from 'react'
import type { BusinessConfigInput } from '@shared/contracts'
import { Printer, FileText, CheckCircle2 } from '../../../shared/icons/Icons'

interface InvoiceFormatSectionProps {
  values: BusinessConfigInput
  onChange: (patch: Partial<BusinessConfigInput>) => void
  disabled?: boolean
}

export const InvoiceFormatSection: React.FC<InvoiceFormatSectionProps> = ({
  values,
  onChange,
  disabled = false
}) => {
  const currentPaper = values.invoicePaperSize || 'TICKET_80MM'
  const currentMode = values.invoiceOutputMode || 'PRINT_DIRECT'

  const paperOptions = [
    {
      id: 'TICKET_80MM',
      title: 'Ticket Térmico 80mm',
      subtitle: 'Estándar POS / Supermercados',
      desc: 'Ideal para impresoras de rollo continuo térmico estándar (80mm). Formato compacto y ágil.',
      badge: 'Recomendado POS'
    },
    {
      id: 'TICKET_58MM',
      title: 'Ticket Térmico 58mm',
      subtitle: 'Impresoras Compactas / Portátiles',
      desc: 'Para impresoras térmicas pequeñas de 58mm o terminales portátiles con papel angosto.',
      badge: 'Compacto'
    },
    {
      id: 'LETTER_PDF',
      title: 'Hoja Carta / A4 (PDF)',
      subtitle: 'Impresoras Estándar / Ferreterías',
      desc: 'Diseñado para negocios sin impresora de ticket. Genera factura comercial en formato carta/A4 completa para descargar o imprimir.',
      badge: 'Ferreterías & Mayoristas'
    }
  ] as const

  const modeOptions = [
    {
      id: 'PRINT_DIRECT',
      title: 'Impresión Directa',
      desc: 'Envía directamente la orden al controlador de la impresora sin abrir ventanas intermedias.'
    },
    {
      id: 'PREVIEW_AND_DOWNLOAD',
      title: 'Visualizar en Pantalla y Descargar PDF',
      desc: 'Muestra la factura en pantalla al concretar la venta con botones para descargar en PDF, imprimir o enviar.'
    }
  ] as const

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#0067C0] mb-1">
          Formato de Papel / Documento de Venta
        </label>
        <p className="text-[11px] text-slate-500 mb-3">
          Seleccione el tipo de formato adecuado según el equipo de impresión que posea en su negocio.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {paperOptions.map((opt) => {
            const isSelected = currentPaper === opt.id
            return (
              <div
                key={opt.id}
                onClick={() => !disabled && onChange({ invoicePaperSize: opt.id })}
                className={`relative flex flex-col justify-between p-3.5 rounded-md border text-left transition-all ${
                  disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#0067C0]'
                } ${
                  isSelected
                    ? 'border-[#0067C0] bg-[#0067C0]/5 ring-1 ring-[#0067C0]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {opt.badge}
                    </span>
                    {isSelected && <CheckCircle2 size={16} className="text-[#0067C0]" />}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1 font-bold text-xs text-slate-800">
                    {opt.id === 'LETTER_PDF' ? (
                      <FileText size={15} className="text-[#0067C0]" />
                    ) : (
                      <Printer size={15} className="text-slate-600" />
                    )}
                    <span>{opt.title}</span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 mb-1.5">{opt.subtitle}</div>
                  <p className="text-[10px] text-slate-600 leading-normal">{opt.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#0067C0] mb-1">
          Modo de Emisión al Finalizar la Venta
        </label>
        <p className="text-[11px] text-slate-500 mb-3">
          Elija si desea imprimir de inmediato o abrir la vista previa interactiva con opción a guardar PDF.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modeOptions.map((opt) => {
            const isSelected = currentMode === opt.id
            return (
              <div
                key={opt.id}
                onClick={() => !disabled && onChange({ invoiceOutputMode: opt.id })}
                className={`p-3 rounded-md border text-left transition-all ${
                  disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#0067C0]'
                } ${
                  isSelected
                    ? 'border-[#0067C0] bg-[#0067C0]/5 ring-1 ring-[#0067C0]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{opt.title}</span>
                  {isSelected && <CheckCircle2 size={15} className="text-[#0067C0]" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{opt.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default InvoiceFormatSection
