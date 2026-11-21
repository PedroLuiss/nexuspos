import React, { useState, useEffect, useRef } from 'react'
import { CartItem, PaymentMethodType, PaymentDetails } from '../../../shared/types/domain'
import type { CurrencyVesExchangeRate } from '@shared/contracts'
import { formatCurrency, formatVesAmount } from '../../../shared/lib/currency'
import { roundMoney } from '@shared/lib/tax'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { useAllPriceTiers } from '../../../shared/hooks/useAllPriceTiers'
import { computeSaleTotals, formatTaxLabel, resolveProductTax } from '@shared/lib/tax'
import {
  Banknote,
  CreditCard,
  Layers,
  X,
  Check,
  Printer,
  DollarSign,
  AlertCircle
} from '../../../shared/icons/Icons'
import { CurrencyInput } from '../../../shared/ui/CurrencyInput'

interface SaleModalProps {
  isOpen: boolean
  total: number
  subtotal: number
  discount: number
  items: CartItem[]
  customerId?: string
  ticketNumber: string
  initialMethod: PaymentMethodType
  exchangeRate: CurrencyVesExchangeRate | null
  canCompleteSale: boolean
  onClose: () => void
  onConfirmSale: (details: PaymentDetails) => Promise<boolean | void> | boolean | void
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  total,
  subtotal,
  discount,
  items,
  customerId,
  ticketNumber,
  initialMethod,
  exchangeRate,
  canCompleteSale,
  onClose,
  onConfirmSale
}) => {
  const { config: businessConfig } = useBusinessConfig()
  const { tiersByProduct } = useAllPriceTiers()
  const taxBreakdown = computeSaleTotals(
    items.map((item) => {
      const tax = resolveProductTax(item.product, businessConfig)
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
    {
      taxEnabled: businessConfig.taxEnabled,
      pricesIncludeTax: businessConfig.pricesIncludeTax
    }
  ).taxBreakdown
  const [method, setMethod] = useState<PaymentMethodType>(initialMethod)
  const [cashTendered, setCashTendered] = useState<number>(total)
  const [cardAuth, setCardAuth] = useState<string>('')
  const [mixedCash, setMixedCash] = useState<number>(Math.floor(total / 2))
  const [printReceipt, setPrintReceipt] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Hotkey listener for F12, Escape, F6, F7, F8 inside modal
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      const hasNoModifiers = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey

      if (hasNoModifiers && e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (hasNoModifiers && e.key === 'F12') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      } else if (hasNoModifiers && e.key === 'F6') {
        e.preventDefault()
        setMethod('cash')
      } else if (hasNoModifiers && e.key === 'F7') {
        e.preventDefault()
        setMethod('card')
      } else if (hasNoModifiers && e.key === 'F8') {
        e.preventDefault()
        setMethod('mixed')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Cash change calculation
  const changeDue = roundMoney(Math.max(0, cashTendered - total))
  const isCashSufficient = cashTendered >= total

  // Mixed calculation
  const mixedCardRemainder = roundMoney(Math.max(0, total - mixedCash))

  const quickCashAmounts = [
    { label: 'Exacto', value: total },
    { label: formatCurrency(50, businessConfig.currency), value: 50 },
    { label: formatCurrency(100, businessConfig.currency), value: 100 },
    { label: formatCurrency(200, businessConfig.currency), value: 200 },
    { label: formatCurrency(500, businessConfig.currency), value: 500 },
    { label: formatCurrency(1000, businessConfig.currency), value: 1000 }
  ]

  const handleConfirm = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!canCompleteSale || isSubmitting) return
    if (method === 'cash' && !isCashSufficient) {
      return
    }
    if (method === 'credit' && !customerId) return

    const details: PaymentDetails = {
      method,
      amountPaid:
        method === 'cash' ? roundMoney(cashTendered) : method === 'credit' ? 0 : roundMoney(total),
      change: method === 'cash' ? roundMoney(changeDue) : 0,
      cardReference: method === 'card' ? cardAuth : undefined,
      cashAmount: method === 'mixed' ? roundMoney(mixedCash) : undefined,
      cardAmount: method === 'mixed' ? roundMoney(mixedCardRemainder) : undefined,
      customerId,
      ticketNumber
    }

    setIsSubmitting(true)
    try {
      await onConfirmSale(details)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
      <div
        className="w-full max-w-xl bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal"
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Fluent POS Engine Layer 400 */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0]">
              <DollarSign size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Terminal POS - Modal de Cobro
              </h2>
              <p className="text-[11px] text-[#5C5C5C]">Calculadora de cambio y formas de pago</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] rounded-[4px] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Big Total Banner */}
        <div className="bg-[#F3F3F3] border-b border-[#E5E5E5] px-5 py-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#5C5C5C] font-semibold">
              Total a Pagar
            </span>
            <div className="text-3xl font-extrabold font-mono text-[#1B1B1B] tracking-tight">
              {formatCurrency(total, businessConfig.currency)}
            </div>
            <div className="mt-1 text-[11px] text-[#5C5C5C]">
              {businessConfig.currency !== 'VES' && exchangeRate
                ? `≈ ${formatVesAmount(total * exchangeRate.rate)} · BCV ${exchangeRate.rate.toFixed(2)}${exchangeRate.isStale ? ' (tasa desactualizada)' : ''}`
                : businessConfig.currency === 'VES'
                  ? 'Moneda de operación: Bolívar'
                  : 'Tasa BCV no disponible'}
            </div>
          </div>
          <div className="text-right text-xs text-[#5C5C5C] space-y-0.5 font-medium">
            <div>{items.length} artículos en la orden</div>
            <div className="font-mono text-[11px]">
              Subtotal: {formatCurrency(subtotal, businessConfig.currency)}
            </div>
            {businessConfig.taxEnabled ? (
              taxBreakdown
                .filter((line) => line.taxRate > 0)
                .map((line) => (
                  <div
                    key={`${line.taxId ?? line.taxName}-${line.taxRate}`}
                    className="font-mono text-[11px]"
                  >
                    {formatTaxLabel(line.taxName, line.taxRate)}
                    {businessConfig.pricesIncludeTax ? ' incluido' : ''}:{' '}
                    {formatCurrency(line.amount, businessConfig.currency)}
                  </div>
                ))
            ) : (
              <div className="font-mono text-[11px]">Sin impuesto</div>
            )}
            {discount > 0 && (
              <div className="text-[#107C41] font-semibold text-[11px]">
                Descuento: -{formatCurrency(discount, businessConfig.currency)}
              </div>
            )}
          </div>
        </div>

        <form ref={formRef} onSubmit={handleConfirm}>
          <div className="p-5 space-y-4">
            {!canCompleteSale && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-[#C42B1C]"
              >
                <AlertCircle size={14} />
                No se puede generar la venta: hay productos sin stock suficiente.
              </div>
            )}
            {/* Payment Method Selector Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-[4px] border text-xs font-semibold transition-all cursor-pointer ${
                    method === 'cash'
                      ? 'border-[#0067C0] bg-[#EBF0F5] text-[#0067C0] shadow-xs'
                      : 'border-[#D1D1D1] bg-white text-[#5C5C5C] hover:bg-[#F9F9F9]'
                  }`}
                >
                  <Banknote size={18} />
                  <span>Efectivo</span>
                  <span className="kbd-badge mt-0.5 text-[10px]">F6</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-[4px] border text-xs font-semibold transition-all cursor-pointer ${
                    method === 'card'
                      ? 'border-[#0067C0] bg-[#EBF0F5] text-[#0067C0] shadow-xs'
                      : 'border-[#D1D1D1] bg-white text-[#5C5C5C] hover:bg-[#F9F9F9]'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Tarjeta</span>
                  <span className="kbd-badge mt-0.5 text-[10px]">F7</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('mixed')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-[4px] border text-xs font-semibold transition-all cursor-pointer ${
                    method === 'mixed'
                      ? 'border-[#0067C0] bg-[#EBF0F5] text-[#0067C0] shadow-xs'
                      : 'border-[#D1D1D1] bg-white text-[#5C5C5C] hover:bg-[#F9F9F9]'
                  }`}
                >
                  <Layers size={18} />
                  <span>Pago Mixto</span>
                  <span className="kbd-badge mt-0.5 text-[10px]">F8</span>
                </button>
                <button
                  type="button"
                  disabled={!customerId}
                  onClick={() => setMethod('credit')}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-[4px] border text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    method === 'credit'
                      ? 'border-[#0067C0] bg-[#EBF0F5] text-[#0067C0] shadow-xs'
                      : 'border-[#D1D1D1] bg-white text-[#5C5C5C] hover:bg-[#F9F9F9]'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Crédito</span>
                  <span className="kbd-badge mt-0.5 text-[10px]">Cliente</span>
                </button>
              </div>
            </div>

            {/* Method Details */}
            {method === 'cash' && (
              <div className="space-y-3 bg-[#F9F9F9] p-3.5 rounded-[4px] border border-[#E5E5E5]">
                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                    Monto Recibido en Efectivo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783] font-bold text-sm">
                      {businessConfig.currency}
                    </span>
                    <CurrencyInput
                      min="0"
                      autoFocus
                      value={cashTendered}
                      onValueChange={setCashTendered}
                      className="w-full pl-8 pr-3 py-2 text-lg font-bold font-mono text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                    />
                  </div>
                </div>

                {/* Quick denomination chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickCashAmounts.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setCashTendered(q.value)}
                      className="px-2.5 py-1 text-xs font-semibold font-mono bg-white hover:bg-[#EBEBEB] border border-[#D1D1D1] rounded-[3px] text-[#1B1B1B] transition-colors cursor-pointer"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Change calculation */}
                <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-[#5C5C5C]">
                      Cambio a entregar al cliente:
                    </span>
                    {!isCashSufficient && (
                      <span className="text-[11px] text-[#C42B1C] font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle size={12} />
                        Monto insuficiente (Faltan{' '}
                        {formatCurrency(total - cashTendered, businessConfig.currency)})
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      isCashSufficient ? 'text-[#107C41]' : 'text-[#717783]'
                    }`}
                  >
                    {formatCurrency(changeDue, businessConfig.currency)}
                  </div>
                </div>
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-3 bg-[#F9F9F9] p-3.5 rounded-[4px] border border-[#E5E5E5] text-xs">
                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-[4px] text-emerald-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-medium">
                    Registre el cobro aprobado en su terminal bancaria.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                    Número de Autorización / Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. AUT-89472"
                    value={cardAuth}
                    onChange={(e) => setCardAuth(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0]"
                  />
                </div>
              </div>
            )}

            {method === 'mixed' && (
              <div className="space-y-3 bg-[#F9F9F9] p-3.5 rounded-[4px] border border-[#E5E5E5] text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1B1B1B] mb-1">
                      Parte en Efectivo ({businessConfig.currency})
                    </label>
                    <CurrencyInput
                      min="0"
                      max={total}
                      value={mixedCash}
                      onValueChange={setMixedCash}
                      className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1B1B1B] mb-1">
                      Restante en Tarjeta ({businessConfig.currency})
                    </label>
                    <div className="px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] font-bold font-mono text-[#0067C0]">
                      {formatCurrency(mixedCardRemainder, businessConfig.currency)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {method === 'credit' && (
              <div className="rounded-[4px] border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                La venta se asociará al cliente seleccionado y se registrará en su cuenta por
                cobrar. El sistema validará el límite de crédito antes de confirmar.
              </div>
            )}

            {/* Print receipt checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                  className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1] focus:ring-[#0067C0]"
                />
                <span className="text-xs text-[#1B1B1B] font-medium flex items-center gap-1.5">
                  <Printer size={13} className="text-[#5C5C5C]" />
                  Imprimir ticket térmico 80mm al procesar
                </span>
              </label>

              <span className="kbd-badge">ENTER</span>
            </div>
          </div>

          {/* Footer - Fluent POS Engine standard buttons */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] shadow-xs transition-colors cursor-pointer"
            >
              <span>Cancelar</span>
              <span className="kbd-badge">ESC</span>
            </button>
            <button
              type="submit"
              disabled={
                !canCompleteSale ||
                isSubmitting ||
                (method === 'cash' && !isCashSufficient) ||
                (method === 'credit' && !customerId)
              }
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] active:bg-[#005228] disabled:bg-slate-300 rounded-[4px] shadow-xs transition-colors cursor-pointer"
            >
              <Check size={15} />
              <span>
                {isSubmitting
                  ? 'Procesando…'
                  : `Confirmar Venta (${formatCurrency(total, businessConfig.currency)})`}
              </span>
              <span className="kbd-badge bg-[#005228]/50 text-white border-emerald-700/50">
                F12
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SaleModal
