import { useCallback, useEffect, useState } from 'react'
import type {
  CashRegisterData,
  CloseCashShiftInput,
  CreateCashMovementInput,
  OpenCashShiftInput
} from '@shared/contracts'
import { CashShiftOverview } from './components/CashShiftOverview'
import { CashShiftHistoryPanel } from './components/CashShiftHistoryPanel'
import { CashierOpenShiftsPanel } from './components/CashierOpenShiftsPanel'
import { CashShiftDialog, type CashShiftDialogType } from './components/CashShiftDialog'
import { Clock, Minus, Wallet } from '../../shared/icons/Icons'

interface CashShiftViewProps {
  register: CashRegisterData
  isLoading: boolean
  error: string | null
  canManageMovements: boolean
  canReturnSales: boolean
  isAdmin: boolean
  onRefresh: () => void
  onSelectShift: (shiftId: string) => void
  onOpenShift: (input: OpenCashShiftInput) => Promise<boolean>
  onCloseShift: (input: CloseCashShiftInput) => Promise<boolean>
  onAddCashMovement: (input: CreateCashMovementInput) => Promise<boolean>
  onReturnSale: (saleId: string) => Promise<boolean>
}

const formatDate = (date: string): string => new Date(date).toLocaleString('es-VE')

export function CashShiftView({
  register,
  isLoading,
  error,
  canManageMovements,
  canReturnSales,
  isAdmin,
  onRefresh,
  onSelectShift,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
  onReturnSale
}: CashShiftViewProps): React.JSX.Element {
  const { shift, movements, tickets } = register
  const [dialog, setDialog] = useState<CashShiftDialogType | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showOpenCashiers, setShowOpenCashiers] = useState(false)
  const activeShiftId = register.activeShiftId
  const isOwnOpenShift = Boolean(shift && shift.id === activeShiftId && shift.isOpen)
  const isSelectedShiftOpen = Boolean(shift?.isOpen)
  const hasActiveShift = Boolean(activeShiftId)
  const openCashierShifts = register.shiftOptions.filter(
    (option) => !option.closedAt && option.cashierRole === 'CASHIER'
  )

  const openDialog = useCallback((next: CashShiftDialogType): void => setDialog(next), [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        !canManageMovements ||
        !isOwnOpenShift ||
        dialog !== null ||
        showHistory ||
        showOpenCashiers ||
        document.querySelector('[aria-modal="true"], [role="dialog"], .fixed.inset-0') ||
        event.repeat ||
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.getModifierState('AltGraph') ||
        event.key.toLowerCase() !== 'g'
      ) {
        return
      }

      event.preventDefault()
      openDialog('expense')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canManageMovements, dialog, isOwnOpenShift, openDialog, showHistory, showOpenCashiers])

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-[#F3F3F3] p-3">
      {error && (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          {error}
        </div>
      )}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#E5E5E5] bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#0067C0]/10 text-[#0067C0]">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#1B1B1B]">
              Caja y turnos
            </h2>
            <p className="mt-1 text-xs text-[#5C5C5C]">
              {shift
                ? `${shift.cashierName} · ${isSelectedShiftOpen ? 'Abierta' : 'Turno cerrado'} · ${formatDate(shift.openedAt)}`
                : 'No hay turnos registrados para este usuario.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setShowOpenCashiers(true)}
                disabled={isLoading}
                className="rounded border border-[#0067C0]/30 bg-[#0067C0]/5 px-3 py-1.5 text-xs font-semibold text-[#005A9E] disabled:opacity-50"
              >
                Cajas abiertas de cajeros ({openCashierShifts.length})
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                disabled={isLoading}
                className="rounded border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Historial de cajas (
                {register.shiftOptions.filter((option) => option.closedAt).length})
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded border border-[#D1D1D1] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Actualizando…' : 'Actualizar'}
          </button>
          {!hasActiveShift ? (
            <button
              type="button"
              onClick={() => openDialog('open')}
              className="flex items-center gap-1.5 rounded bg-[#0067C0] px-3 py-1.5 text-xs font-bold text-white"
            >
              <Clock size={14} /> Apertura de caja
            </button>
          ) : !isOwnOpenShift && activeShiftId ? (
            <button
              type="button"
              onClick={() => onSelectShift(activeShiftId)}
              className="rounded bg-[#0067C0] px-3 py-1.5 text-xs font-bold text-white"
            >
              Ir a caja abierta
            </button>
          ) : (
            <>
              {canManageMovements && (
                <>
                  <button
                    type="button"
                    onClick={() => openDialog('income')}
                    className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                  >
                    Registrar ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => openDialog('expense')}
                    className="flex items-center gap-1 rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#C42B1C]"
                  >
                    <Minus size={13} /> Gasto manual <span className="kbd-badge">ALT+G</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => openDialog('close')}
                className="rounded bg-[#107C41] px-3 py-1.5 text-xs font-bold text-white"
              >
                Cierre / Arqueo Z
              </button>
            </>
          )}
        </div>
      </header>

      {shift && (
        <CashShiftOverview
          shift={shift}
          movements={movements}
          tickets={tickets}
          isOpen={isSelectedShiftOpen}
          canReturnSales={canReturnSales}
          onReturnSale={onReturnSale}
        />
      )}

      {dialog && (
        <CashShiftDialog
          dialog={dialog}
          shift={isOwnOpenShift ? shift : null}
          onDismiss={() => setDialog(null)}
          onOpenShift={onOpenShift}
          onCloseShift={onCloseShift}
          onAddCashMovement={onAddCashMovement}
        />
      )}
      {showHistory && isAdmin && (
        <CashShiftHistoryPanel
          options={register.shiftOptions}
          selectedShiftId={shift?.id}
          disabled={isLoading}
          onSelect={onSelectShift}
          onRefresh={onRefresh}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showOpenCashiers && isAdmin && (
        <CashierOpenShiftsPanel
          shifts={openCashierShifts}
          selectedShiftId={shift?.id}
          disabled={isLoading}
          onSelect={onSelectShift}
          onRefresh={onRefresh}
          onClose={() => setShowOpenCashiers(false)}
        />
      )}
    </div>
  )
}

export default CashShiftView
