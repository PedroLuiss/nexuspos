import React, { useState } from 'react'
import { X } from '../../../shared/icons/Icons'

interface BusinessInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { companyName: string; taxId: string; phone: string; header: string; footer: string }) => void
  initialData: { companyName: string; taxId: string; phone: string; header: string; footer: string }
}

export const BusinessInfoModal: React.FC<BusinessInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [companyName, setCompanyName] = useState(initialData.companyName)
  const [taxId, setTaxId] = useState(initialData.taxId)
  const [phone, setPhone] = useState(initialData.phone)
  const [ticketHeader, setTicketHeader] = useState(initialData.header)
  const [ticketFooter, setTicketFooter] = useState(initialData.footer)

  if (!isOpen) return null

  const handleSave = (): void => {
    onSave({ companyName, taxId, phone, header: ticketHeader, footer: ticketFooter })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
      <div className="w-full max-w-lg bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
        <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Datos de Negocio & Plantilla de Ticket
          </h3>
          <button onClick={onClose} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1B1B1B] mb-1">Razón Social</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1B1B1B] mb-1">RFC / CIF Fiscal</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] font-mono text-[#1B1B1B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1B1B1B] mb-1">Teléfono de Contacto</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B1B1B] mb-1">Encabezado de Ticket</label>
            <input
              type="text"
              value={ticketHeader}
              onChange={(e) => setTicketHeader(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1B1B1B] mb-1">Pie de Página de Ticket</label>
            <textarea
              rows={2}
              value={ticketFooter}
              onChange={(e) => setTicketFooter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] resize-none text-[#1B1B1B]"
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] rounded-[4px] shadow-xs cursor-pointer"
          >
            Guardar Datos Fiscales
          </button>
        </div>
      </div>
    </div>
  )
}

export default BusinessInfoModal
