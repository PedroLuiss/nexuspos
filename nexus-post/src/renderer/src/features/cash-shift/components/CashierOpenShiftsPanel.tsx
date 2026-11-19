import type { CashRegisterData } from '@shared/contracts'

type CashShiftOption = CashRegisterData['shiftOptions'][number]

interface CashierOpenShiftsPanelProps {
  shifts: CashShiftOption[]
  selectedShiftId?: string
  disabled: boolean
  onSelect: (shiftId: string) => void
  onClose: () => void
}

const formatDate = (date: string): string => new Date(date).toLocaleString('es-VE')

const formatMoney = (amount: number): string =>
  `$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function CashierOpenShiftsPanel({
  shifts,
  selectedShiftId,
  disabled,
  onSelect,
  onClose
}: CashierOpenShiftsPanelProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded border border-[#D1D1D1] bg-white shadow-xl">
        <header className="border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <h3 className="text-sm font-bold uppercase">Cajas abiertas de cajeros</h3>
          <p className="mt-1 text-xs text-[#5C5C5C]">
            {shifts.length} {shifts.length === 1 ? 'caja abierta' : 'cajas abiertas'} · Selecciona
            una para consultar sus ventas y movimientos.
          </p>
        </header>
        <div className="overflow-auto p-4">
          {shifts.length === 0 ? (
            <p className="rounded border border-dashed border-[#D1D1D1] p-8 text-center text-xs text-[#5C5C5C]">
              No hay cajas abiertas de cajeros en este momento.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-white text-[10px] uppercase text-[#5C5C5C]">
                <tr className="border-b border-[#E5E5E5]">
                  <th className="px-3 py-2">Cajero</th>
                  <th className="px-3 py-2">Apertura</th>
                  <th className="px-3 py-2 text-right">Fondo inicial</th>
                  <th className="px-3 py-2 text-right">Efectivo esperado</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className={
                      shift.id === selectedShiftId ? 'bg-[#0067C0]/5' : 'hover:bg-[#F9F9F9]'
                    }
                  >
                    <td className="px-3 py-3 font-semibold">{shift.cashierName}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(shift.openedAt)}</td>
                    <td className="px-3 py-3 text-right font-mono">
                      {formatMoney(shift.openingAmount)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {formatMoney(shift.expectedCash)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onSelect(shift.id)
                          onClose()
                        }}
                        className="rounded bg-[#0067C0] px-3 py-1.5 font-semibold text-white hover:bg-[#005A9E] disabled:opacity-50"
                      >
                        Ver caja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <footer className="flex justify-end border-t border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  )
}
