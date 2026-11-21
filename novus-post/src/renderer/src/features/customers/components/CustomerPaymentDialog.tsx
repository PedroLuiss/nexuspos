import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import type { Customer } from '@shared/contracts'
import { CurrencyInput } from '../../../shared/ui/CurrencyInput'
import { Modal } from '../../../shared/ui/Modal'
import { formatCurrency } from '../../../shared/lib/currency'
import { getCurrencySymbol } from '../../../shared/lib/businessConfig'

interface CustomerPaymentDialogProps {
  isOpen: boolean
  customer: Customer | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (amount: number, concept: string) => Promise<void>
}

export function CustomerPaymentDialog({
  isOpen,
  customer,
  isSaving,
  onClose,
  onSubmit
}: CustomerPaymentDialogProps): JSX.Element | null {
  const [amount, setAmount] = useState(customer?.currentDebt ?? 0)
  const [concept, setConcept] = useState('Abono a cuenta general')

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (Number.isFinite(amount) && amount > 0) void onSubmit(amount, concept.trim())
  }

  if (!customer) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar abono a cuenta"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md border border-[#D1D1D1] bg-white px-4 py-2 text-xs font-semibold text-[#5C5C5C] hover:bg-[#F3F3F3] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="customer-payment-form"
            disabled={isSaving || amount <= 0 || amount > customer.currentDebt}
            className="rounded-md bg-[#107C41] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F7B0F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Registrando…' : 'Confirmar e ingresar a caja'}
          </button>
        </>
      }
    >
      <form id="customer-payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#717783]">
              Saldo pendiente
            </p>
            <p className="mt-1 text-xs font-semibold text-[#1B1B1B]">{customer.name}</p>
          </div>
          <strong className="font-mono text-xl text-[#C42B1C]">
            {formatCurrency(customer.currentDebt, customer.currency)}
          </strong>
        </div>
        <label className="block space-y-1 text-xs font-semibold text-[#1B1B1B]">
          Monto recibido
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]">
              {getCurrencySymbol(customer.currency)}
            </span>
            <CurrencyInput
              autoFocus
              min="0.01"
              max={customer.currentDebt}
              required
              value={amount}
              onValueChange={setAmount}
              className="w-full rounded-md border border-[#D1D1D1] py-2 pl-7 pr-3 font-mono text-lg font-bold outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
            />
          </div>
          {amount > customer.currentDebt && (
            <span className="block text-[11px] font-medium text-[#C42B1C]">
              El abono no puede superar el saldo pendiente.
            </span>
          )}
        </label>
        <label className="block space-y-1 text-xs font-semibold text-[#1B1B1B]">
          Concepto
          <input
            maxLength={160}
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
            className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
          />
        </label>
        <p className="rounded-md bg-[#F3F3F3] px-3 py-2 text-[11px] text-[#5C5C5C]">
          El abono se aplicará primero a las deudas más antiguas y generará un ingreso en el turno
          de caja abierto.
        </p>
      </form>
    </Modal>
  )
}
