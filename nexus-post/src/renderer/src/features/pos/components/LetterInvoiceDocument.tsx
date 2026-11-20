import React from 'react'
import type { CartItem, PaymentDetails } from '../../../shared/types/domain'
import type { BusinessConfig, CurrencyVesExchangeRate, Customer } from '@shared/contracts'
import { formatBusinessAddress } from '../../../shared/lib/businessConfig'
import { formatCurrency, formatVesAmount } from '../../../shared/lib/currency'
import { formatProductQuantity } from '@shared/lib/product-quantity'
import { formatTaxLabel } from '@shared/lib/tax'

interface LetterInvoiceDocumentProps {
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
  customer?: Customer | null
  customerDisplayName?: string
  exchangeRate: CurrencyVesExchangeRate | null
}

export const LetterInvoiceDocument: React.FC<LetterInvoiceDocumentProps> = ({
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
  customer,
  customerDisplayName,
  exchangeRate
}) => {
  const invoiceDate = new Date().toLocaleDateString('es-VE')
  const invoiceTime = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="w-[680px] bg-white p-7 shadow-lg border border-slate-200 text-slate-800 font-sans text-xs print:w-full print:p-0 print:border-none print:shadow-none">
      {/* Encabezado Principal */}
      <div className="flex justify-between items-start pb-5 border-b-2 border-[#0067C0]">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            {business.legalName || 'NEXUS MARKET C.A.'}
          </h1>
          {business.tradeName && (
            <div className="text-xs font-bold text-[#0067C0] mb-1">{business.tradeName}</div>
          )}
          {business.taxId && (
            <div className="text-[11px] font-semibold text-slate-600">
              {business.taxIdType || 'RIF'}: {business.taxId}
            </div>
          )}
          <div className="text-[11px] text-slate-500 max-w-sm mt-0.5 leading-snug">
            {formatBusinessAddress(business)}
          </div>
          {business.phone && (
            <div className="text-[11px] text-slate-500">Teléfono: {business.phone}</div>
          )}
          {business.email && (
            <div className="text-[11px] text-slate-500">Correo: {business.email}</div>
          )}
        </div>

        {/* Recuadro de Factura */}
        <div className="text-right border border-slate-300 rounded p-3 bg-slate-50 min-w-[200px]">
          <div className="text-[10px] font-extrabold uppercase text-[#0067C0] tracking-wider">
            FACTURA / NOTA DE ENTREGA
          </div>
          <div className="text-base font-black text-slate-900 mt-0.5">#{ticketNumber}</div>
          <div className="text-[10px] text-slate-600 mt-1">
            <strong>Fecha:</strong> {invoiceDate} {invoiceTime}
          </div>
          {business.ticketShowCashier && (
            <div className="text-[10px] text-slate-500 mt-0.5">
              <strong>Cajero:</strong> {cashierName}
            </div>
          )}
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="my-4 p-3 bg-[#F9FAFB] border border-slate-200 rounded text-[11px]">
        <div className="font-bold text-[#0067C0] text-[10px] uppercase mb-1.5 tracking-wider">
          DATOS DEL CLIENTE / RECEPTOR
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div>
            <span className="text-slate-500 font-semibold">Nombre / Razón Social: </span>
            <span className="font-bold text-slate-900">
              {customer?.name || customerDisplayName || 'CLIENTE DE CONTADO'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Cédula / RIF: </span>
            <span className="font-bold text-slate-900">{customer?.taxId || 'V-00000000'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Teléfono: </span>
            <span>{customer?.phone || 'No registrado'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Correo: </span>
            <span>{customer?.email || 'No registrado'}</span>
          </div>
          {customer?.address && (
            <div className="col-span-2">
              <span className="text-slate-500 font-semibold">Dirección: </span>
              <span>{customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Productos / Renglones */}
      <table className="w-full my-4 text-[11px] border-collapse">
        <thead>
          <tr className="bg-[#0067C0]/10 border-y border-[#0067C0]/30 text-slate-800">
            <th className="py-2 px-2 text-left font-bold">#</th>
            <th className="py-2 px-2 text-left font-bold">DESCRIPCIÓN</th>
            <th className="py-2 px-2 text-center font-bold">CANTIDAD</th>
            <th className="py-2 px-2 text-right font-bold">PRECIO UNIT.</th>
            <th className="py-2 px-2 text-right font-bold">DESC.</th>
            <th className="py-2 px-2 text-right font-bold">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, index) => {
            const lineTotal =
              item.product.salePrice * item.quantity * (1 - item.discountPercent / 100)
            return (
              <tr key={item.product.id} className="hover:bg-slate-50">
                <td className="py-1.5 px-2 text-slate-400">{index + 1}</td>
                <td className="py-1.5 px-2">
                  <div className="font-semibold text-slate-900">{item.product.name}</div>
                  {item.product.code && (
                    <div className="text-[10px] text-slate-400">Cód: {item.product.code}</div>
                  )}
                </td>
                <td className="py-1.5 px-2 text-center">
                  {formatProductQuantity(item.quantity)} {item.product.unit}
                </td>
                <td className="py-1.5 px-2 text-right">
                  {formatCurrency(item.product.salePrice, business.currency)}
                </td>
                <td className="py-1.5 px-2 text-right text-emerald-700">
                  {item.discountPercent > 0 ? `-${item.discountPercent}%` : '—'}
                </td>
                <td className="py-1.5 px-2 text-right font-bold">
                  {formatCurrency(lineTotal, business.currency)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Bloque de Totales */}
      <div className="flex justify-between items-start pt-3 border-t-2 border-slate-200">
        <div className="max-w-xs space-y-2 text-[10px] text-slate-500">
          {payment && (
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="font-bold text-slate-700 uppercase">Forma de Pago: </span>
              <span className="font-bold text-[#0067C0] uppercase">{payment.method}</span>
              {payment.method === 'cash' && (
                <div className="mt-0.5">
                  Efectivo: {formatCurrency(payment.amountPaid, business.currency)} | Vuelto:{' '}
                  {formatCurrency(payment.change, business.currency)}
                </div>
              )}
            </div>
          )}
          {business.ticketLegalNote && (
            <div className="italic leading-snug">{business.ticketLegalNote}</div>
          )}
        </div>

        <div className="w-64 space-y-1 text-right text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(subtotal, business.currency)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Descuentos:</span>
              <span className="font-semibold">-{formatCurrency(discount, business.currency)}</span>
            </div>
          )}
          {business.taxEnabled &&
            taxBreakdown
              .filter((l) => l.taxRate > 0)
              .map((l) => (
                <div key={`${l.taxId ?? l.taxName}-${l.taxRate}`} className="flex justify-between text-slate-600">
                  <span>{formatTaxLabel(l.taxName, l.taxRate)}:</span>
                  <span className="font-semibold">{formatCurrency(l.amount, business.currency)}</span>
                </div>
              ))}
          {business.taxEnabled && taxBreakdown.every((l) => l.taxRate <= 0) && tax > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>{business.taxName} ({business.taxRate}%):</span>
              <span className="font-semibold">{formatCurrency(tax, business.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
            <span>TOTAL A PAGAR:</span>
            <span className="text-[#0067C0]">{formatCurrency(total, business.currency)}</span>
          </div>
          {business.currency !== 'VES' && (
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Ref. BCV (VES):</span>
              <span>{exchangeRate ? formatVesAmount(total * exchangeRate.rate) : 'No disponible'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Firmas de Conforme */}
      <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-slate-300 text-center text-[10px] text-slate-500">
        <div>
          <div className="border-t border-slate-400 mx-8 pt-1 font-semibold text-slate-700">
            Entregado Por (Firma / Sello)
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 mx-8 pt-1 font-semibold text-slate-700">
            Recibido Conforme (Cliente)
          </div>
        </div>
      </div>
    </div>
  )
}

export default LetterInvoiceDocument
