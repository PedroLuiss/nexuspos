import React from 'react'
import type { CartItem, PaymentDetails } from '../../../shared/types/domain'
import type { CurrencyVesExchangeRate, Customer } from '@shared/contracts'
import { Printer, X, Receipt, FileText, Download } from '../../../shared/icons/Icons'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { useAllPriceTiers } from '../../../shared/hooks/useAllPriceTiers'
import { computeSaleTotals, resolveProductTax } from '@shared/lib/tax'
import ThermalTicketDocument from './ThermalTicketDocument'
import LetterInvoiceDocument from './LetterInvoiceDocument'

interface TicketPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment?: PaymentDetails
  ticketNumber: string
  cashierName: string
  customer?: Customer | null
  customerName?: string
  exchangeRate: CurrencyVesExchangeRate | null
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  tax,
  discount,
  total,
  payment,
  ticketNumber,
  cashierName,
  customer,
  customerName,
  exchangeRate
}) => {
  const { config: business } = useBusinessConfig()
  const { tiersByProduct } = useAllPriceTiers()

  const totals = computeSaleTotals(
    items.map((item) => {
      const tax = resolveProductTax(item.product, business)
      return {
        unitPrice: item.product.salePrice,
        priceTiers: tiersByProduct.get(item.product.id),
        quantity: item.quantity,
        discountPercent: item.discountPercent,
        taxId: tax.taxId,
        taxName: tax.taxName,
        taxRate: tax.taxRate
      }
    }),
    { taxEnabled: business.taxEnabled, pricesIncludeTax: business.pricesIncludeTax }
  )

  if (!isOpen) return null

  const isLetter = business.invoicePaperSize === 'LETTER_PDF'
  const is58mm = business.invoicePaperSize === 'TICKET_58MM'
  const clientDisplayName = customer?.name || customerName || 'Cliente'

  const handlePrint = (): void => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop">
      <div
        className={`w-full bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-modal flex flex-col max-h-[92vh] ${
          isLetter ? 'max-w-4xl' : 'max-w-md'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] border-b border-slate-200">
          <div className="flex items-center gap-2">
            {isLetter ? (
              <FileText size={16} className="text-[#0078D4]" />
            ) : (
              <Receipt size={16} className="text-[#0078D4]" />
            )}
            <h3 className="text-xs font-bold text-slate-800">
              {isLetter
                ? 'Vista Previa Factura / Nota Comercial (Carta A4)'
                : is58mm
                  ? 'Vista Previa Ticket Térmico 58mm'
                  : 'Vista Previa Ticket Térmico 80mm'}
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0078D4] border border-blue-200">
              {business.invoicePaperSize || 'TICKET_80MM'}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center items-start">
          {isLetter ? (
            <LetterInvoiceDocument
              business={business}
              items={items}
              subtotal={subtotal}
              tax={tax}
              discount={discount}
              total={total}
              taxBreakdown={totals.taxBreakdown}
              payment={payment}
              ticketNumber={ticketNumber}
              cashierName={cashierName}
              customer={customer}
              customerDisplayName={clientDisplayName}
              exchangeRate={exchangeRate}
            />
          ) : (
            <ThermalTicketDocument
              business={business}
              items={items}
              subtotal={subtotal}
              tax={tax}
              discount={discount}
              total={total}
              taxBreakdown={totals.taxBreakdown}
              payment={payment}
              ticketNumber={ticketNumber}
              cashierName={cashierName}
              customerName={clientDisplayName}
              exchangeRate={exchangeRate}
              is58mm={is58mm}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#f8f9fa] border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            {isLetter ? 'Formato Hoja Carta / A4 comercial' : 'Formato Ticket para impresora de recibos'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-[4px] shadow-xs cursor-pointer"
            >
              {isLetter ? <Download size={14} /> : <Printer size={14} />}
              <span>{isLetter ? 'Imprimir / Descargar PDF' : 'Imprimir Ticket'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketPreviewModal
