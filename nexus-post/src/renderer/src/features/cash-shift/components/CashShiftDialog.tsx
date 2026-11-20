import { useState } from 'react'
import type {
  CashShift,
  CloseCashShiftInput,
  CreateCashMovementInput,
  OpenCashShiftInput
} from '@shared/contracts'
import { roundMoney } from '@shared/lib/tax'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { formatCurrency } from '../../../shared/lib/currency'
import { CashCloseSummary } from './CashCloseSummary'

export type CashShiftDialogType = 'open' | 'close' | 'income' | 'expense'

interface CashShiftDialogProps {
  dialog: CashShiftDialogType
  shift: CashShift | null
  onDismiss: () => void
  onOpenShift: (input: OpenCashShiftInput) => Promise<boolean>
  onCloseShift: (input: CloseCashShiftInput) => Promise<boolean>
  onAddCashMovement: (input: CreateCashMovementInput) => Promise<boolean>
}

export function CashShiftDialog({
  dialog,
  shift,
  onDismiss,
  onOpenShift,
  onCloseShift,
  onAddCashMovement
}: CashShiftDialogProps): React.JSX.Element {
  const { config } = useBusinessConfig()
  const currency = shift?.currency ?? config.currency
  const [amount, setAmount] = useState(dialog === 'open' ? '0.00' : '')
  const [concept, setConcept] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const expectedCash = shift?.expectedCash ?? 0
  const countedCash = amount.trim() === '' ? null : Number(amount.replace(',', '.'))
  const difference =
    countedCash !== null && Number.isFinite(countedCash)
      ? roundMoney(countedCash - expectedCash)
      : null

  const submitDialog = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    const parsedAmount = roundMoney(Number(amount.replace(',', '.')))
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0 ||
      ((dialog === 'income' || dialog === 'expense') && parsedAmount === 0)
    ) {
      setActionError('Ingresa un monto válido.')
      return
    }
    if ((dialog === 'income' || dialog === 'expense') && !concept.trim()) {
      setActionError('La justificación del movimiento es obligatoria.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)
    let succeeded = false
    if (dialog === 'open') succeeded = await onOpenShift({ openingAmount: parsedAmount })
    if (dialog === 'close') succeeded = await onCloseShift({ countedCash: parsedAmount })
    if (dialog === 'income' || dialog === 'expense') {
      succeeded = await onAddCashMovement({
        type: dialog === 'income' ? 'INGRESO' : 'EGRESO',
        amount: parsedAmount,
        concept: concept.trim()
      })
    }
    setIsSubmitting(false)
    if (succeeded) onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(event) => void submitDialog(event)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-[#D1D1D1] bg-white shadow-xl"
      >
        <div className="border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <h3 className="text-xs font-bold uppercase">
            {dialog === 'open'
              ? 'Apertura de caja'
              : dialog === 'close'
                ? 'Cierre de caja / arqueo Z'
                : dialog === 'income'
                  ? 'Ingreso manual'
                  : 'Gasto manual'}
          </h3>
        </div>
        <div className="space-y-3 p-4 text-xs">
          <label className="block font-semibold">
            {dialog === 'close'
              ? `Efectivo contado en gaveta (${currency})`
              : dialog === 'open'
                ? `Fondo inicial (${currency})`
                : `Monto (${currency})`}
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              min="0"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              onBlur={() => {
                if (!amount.trim()) return
                const parsed = Number(amount.replace(',', '.'))
                if (Number.isFinite(parsed)) setAmount(roundMoney(parsed).toFixed(2))
              }}
              placeholder={dialog === 'close' ? 'Cuenta el efectivo y escribe el total' : undefined}
              className="mt-1 w-full rounded border border-[#D1D1D1] px-3 py-2 text-lg font-mono"
            />
          </label>
          {dialog === 'close' && shift && <CashCloseSummary shift={shift} />}
          {(dialog === 'income' || dialog === 'expense') && (
            <label className="block font-semibold">
              Concepto / justificación
              <input
                required
                maxLength={240}
                value={concept}
                onChange={(event) => setConcept(event.target.value)}
                className="mt-1 w-full rounded border border-[#D1D1D1] px-3 py-2"
              />
            </label>
          )}
          {dialog === 'close' && (
            <p
              className={`flex items-center justify-between rounded border p-2 ${
                difference === null
                  ? 'border-[#D1D1D1] bg-[#F9F9F9] text-[#5C5C5C]'
                  : difference === 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : difference > 0
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {difference === null ? (
                <span>Ingresa el efectivo contado para comparar con el esperado.</span>
              ) : (
                <>
                  <span>
                    {difference === 0
                      ? 'Cuadre perfecto'
                      : difference > 0
                        ? 'Sobrante'
                        : 'Faltante'}
                  </span>
                  <strong>{formatCurrency(Math.abs(difference), currency)}</strong>
                </>
              )}
            </p>
          )}
          {actionError && (
            <p role="alert" className="text-red-700">
              {actionError}
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onDismiss}
            className="rounded border border-[#D1D1D1] px-3 py-1.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-[#0067C0] px-3 py-1.5 font-bold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando…' : 'Confirmar'}
          </button>
        </footer>
      </form>
    </div>
  )
}
