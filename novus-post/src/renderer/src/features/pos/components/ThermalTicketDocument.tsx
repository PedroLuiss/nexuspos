import React, { useMemo } from 'react'
import bwipjs from 'bwip-js'
import type { CartItem, PaymentDetails } from '../../../shared/types/domain'
import type { BusinessConfig, CurrencyVesExchangeRate } from '@shared/contracts'
import { formatBusinessAddress } from '../../../shared/lib/businessConfig'
import { formatCurrency, formatVesAmount } from '../../../shared/lib/currency'
import { formatProductQuantity } from '@shared/lib/product-quantity'
import { formatTaxLabel } from '@shared/lib/tax'

interface ThermalTicketDocumentProps {
  business: BusinessConfig
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  taxBreakdown: Array<{ taxId?: string; taxName: string; taxRate: number; amount: number }>
  payment?: PaymentDetails
  ticketNumber: string
  cashierName: string
  customerName?: string
  exchangeRate: CurrencyVesExchangeRate | null
  is58mm?: boolean
}

export const ThermalTicketDocument: React.FC<ThermalTicketDocumentProps> = ({
  business,
  items,
  subtotal,
  tax,
  discount,
  total,
  taxBreakdown,
  payment,
  ticketNumber,
  cashierName,
  customerName,
  exchangeRate,
  is58mm = false
}) => {
  const barcodeSvg = useMemo(() => {
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: ticketNumber.trim(),
        height: 8,
        scale: 2,
        includetext: false,
        padding: 0
      })
    } catch {
      return null
    }
  }, [ticketNumber])

  return (
    <div
      id="thermal-ticket-print"
      className={`bg-white p-3.5 shadow-md font-mono leading-relaxed text-slate-800 border-t-4 border-[#0078D4] ${
        is58mm ? 'w-56 text-[10px]' : 'w-72 text-[11px]'
      }`}
    >
      {/* Encabezado */}
      <div className="text-center pb-2 border-b border-dashed border-slate-300">
        {business.ticketHeader && (
          <div className="text-[9px] text-slate-500 mb-0.5">{business.ticketHeader}</div>
        )}
        <div className="font-extrabold text-sm tracking-wider">{business.legalName || 'NOVUSPOS'}</div>
        {business.tradeName && <div className="text-[10px] text-slate-600">{business.tradeName}</div>}
        {business.ticketShowTaxId && business.taxIdType !== 'NONE' && (
          <div className="text-[10px] text-slate-500">
            {business.taxIdType}: {business.taxId || '—'}
          </div>
        )}
        {business.ticketShowAddress && (
          <div className="text-[10px] text-slate-500">{formatBusinessAddress(business)}</div>
        )}
        {business.ticketShowAddress && business.phone && (
          <div className="text-[10px] text-slate-500">Tel: {business.phone}</div>
        )}
      </div>

      {/* Datos del Ticket */}
      <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>TICKET #{ticketNumber}</span>
          <span>CAJA 01</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Fecha: {new Date().toLocaleDateString('es-VE')}</span>
          <span>{new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {business.ticketShowCashier && <div className="text-slate-600">Cajero: {cashierName}</div>}
        {customerName && <div className="text-slate-600 font-bold">Cliente: {customerName}</div>}
      </div>

      {/* Lista de Artículos */}
      <div className="py-2 border-b border-dashed border-slate-300">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left pb-1">CANT DESCRIPCIÓN</th>
              <th className="text-right pb-1">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.product.id}>
                <td className="py-1">
                  <div className="font-bold line-clamp-1">{item.product.name}</div>
                  <div className="text-[9px] text-slate-500">
                    {formatProductQuantity(item.quantity)} {item.product.unit} x{' '}
                    {formatCurrency(item.product.salePrice, business.currency)}
                    {item.discountPercent > 0 && ` (-${item.discountPercent}%)`}
                  </div>
                </td>
                <td className="text-right align-top py-1 font-bold">
                  {formatCurrency(
                    item.product.salePrice * item.quantity * (1 - item.discountPercent / 100),
                    business.currency
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal, business.currency)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Descuentos:</span>
            <span>-{formatCurrency(discount, business.currency)}</span>
          </div>
        )}
        {business.taxEnabled &&
          taxBreakdown
            .filter((line) => line.taxRate > 0)
            .map((line) => (
              <div key={`${line.taxId ?? line.taxName}-${line.taxRate}`} className="flex justify-between">
                <span>
                  {formatTaxLabel(line.taxName, line.taxRate)}
                  {business.pricesIncludeTax ? ' incluido' : ''}:
                </span>
                <span>{formatCurrency(line.amount, business.currency)}</span>
              </div>
            ))}
        {business.taxEnabled && taxBreakdown.every((l) => l.taxRate <= 0) && tax > 0 && (
          <div className="flex justify-between">
            <span>
              {business.taxName} ({business.taxRate}%):
            </span>
            <span>{formatCurrency(tax, business.currency)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200">
          <span>TOTAL A PAGAR:</span>
          <span>{formatCurrency(total, business.currency)}</span>
        </div>
        {business.currency !== 'VES' && (
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Ref. bolívares (BCV):</span>
            <span>{exchangeRate ? formatVesAmount(total * exchangeRate.rate) : 'No disponible'}</span>
          </div>
        )}

        {payment && (
          <div className="pt-1 text-[10px] space-y-0.5 text-slate-600 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Método de Pago:</span>
              <span className="uppercase font-bold">{payment.method}</span>
            </div>
            {payment.method === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span>Efectivo Recibido:</span>
                  <span>{formatCurrency(payment.amountPaid, business.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Cambio Entregado:</span>
                  <span>{formatCurrency(payment.change, business.currency)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Código de barras y pie */}
      <div className="pt-2 text-center">
        {barcodeSvg ? (
          <div
            className="flex justify-center my-1 [&>svg]:max-h-7 [&>svg]:w-auto"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />
        ) : (
          <div className="h-6" />
        )}
        <div className="text-[9px] text-slate-400 mt-1 font-mono tracking-widest">*{ticketNumber}*</div>
        <div className="text-[9px] text-slate-500 mt-1 italic">
          {business.ticketFooter || '¡Gracias por su compra!'}
        </div>
        {business.ticketLegalNote && (
          <div className="text-[8px] text-slate-400 mt-1">{business.ticketLegalNote}</div>
        )}
      </div>
    </div>
  )
}

export default ThermalTicketDocument
