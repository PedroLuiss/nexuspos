import { useMemo, useState } from 'react'
import type { CashRegisterData } from '@shared/contracts'

interface CashShiftHistoryPanelProps {
  options: CashRegisterData['shiftOptions']
  selectedShiftId?: string
  disabled: boolean
  onSelect: (shiftId: string) => void
  onClose: () => void
}

const formatDate = (date: string | undefined): string =>
  date ? new Date(date).toLocaleString('es-VE') : '—'

export function CashShiftHistoryPanel({
  options,
  selectedShiftId,
  disabled,
  onSelect,
  onClose
}: CashShiftHistoryPanelProps): React.JSX.Element {
  const [cashierFilter, setCashierFilter] = useState('')
  const closedShifts = useMemo(() => options.filter((option) => option.closedAt), [options])
  const filteredShifts = closedShifts.filter((option) =>
    option.cashierName.toLocaleLowerCase().includes(cashierFilter.trim().toLocaleLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded border border-[#D1D1D1] bg-white shadow-xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold uppercase">Cajas cerradas de todos los cajeros</h3>
            <p className="mt-1 text-xs text-[#5C5C5C]">
              {filteredShifts.length} de {closedShifts.length} turnos cerrados
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#5C5C5C]">
            Cajero
            <input
              type="search"
              value={cashierFilter}
              onChange={(event) => setCashierFilter(event.target.value)}
              placeholder="Filtrar por nombre"
              className="rounded border border-[#D1D1D1] bg-white px-2 py-1.5 font-normal text-[#1B1B1B]"
            />
          </label>
        </header>
        <div className="overflow-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="sticky top-0 bg-white text-[10px] uppercase text-[#5C5C5C]">
              <tr className="border-b border-[#E5E5E5]">
                <th className="px-3 py-2">Cajero</th>
                <th className="px-3 py-2">Apertura</th>
                <th className="px-3 py-2">Cierre</th>
                <th className="px-3 py-2 text-right">Fondo inicial</th>
                <th className="px-3 py-2 text-right">Esperado</th>
                <th className="px-3 py-2 text-right">Contado</th>
                <th className="px-3 py-2 text-right">Diferencia</th>
                <th className="px-3 py-2 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#717783]">
                    {closedShifts.length === 0
                      ? 'Todavía no hay cajas cerradas registradas.'
                      : 'No hay cajas cerradas de cajeros que coincidan.'}
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className={
                      shift.id === selectedShiftId ? 'bg-[#0067C0]/5' : 'hover:bg-[#F9F9F9]'
                    }
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-semibold">
                      {shift.cashierName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(shift.openedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(shift.closedAt)}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${shift.openingAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${shift.expectedCash.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {shift.countedCash === undefined ? '—' : `$${shift.countedCash.toFixed(2)}`}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${
                        (shift.difference ?? 0) < 0
                          ? 'text-[#C42B1C]'
                          : (shift.difference ?? 0) > 0
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }`}
                    >
                      {shift.difference === undefined
                        ? '—'
                        : `${shift.difference < 0 ? '-' : shift.difference > 0 ? '+' : ''}$${Math.abs(shift.difference).toFixed(2)}`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onSelect(shift.id)
                          onClose()
                        }}
                        className="rounded border border-[#D1D1D1] bg-white px-2.5 py-1 font-semibold hover:bg-[#F3F3F3] disabled:opacity-50"
                      >
                        Ver caja
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
