import type { CashMovement, CashShift, CashTicket } from '@shared/contracts'
import { AlertCircle, CheckCircle2 } from '../../../shared/icons/Icons'
import { formatCurrency } from '../../../shared/lib/currency'
import { CashTicketsPanel } from './CashTicketsPanel'

interface CashShiftOverviewProps {
  shift: CashShift
  movements: CashMovement[]
  tickets: CashTicket[]
  isOpen: boolean
  canReturnSales: boolean
  onReturnSale: (saleId: string) => Promise<boolean>
}

const formatDate = (date: string): string => new Date(date).toLocaleString('es-VE')

export function CashShiftOverview({
  shift,
  movements,
  tickets,
  isOpen,
  canReturnSales,
  onReturnSale
}: CashShiftOverviewProps): React.JSX.Element {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Ventas netas de la caja"
          value={shift.totalSales}
          currency={shift.currency}
          color="text-[#0067C0]"
        />
        <Metric
          label="Utilidad bruta real"
          value={shift.grossProfit}
          currency={shift.currency}
          color="text-[#107C41]"
          detail="Calculada con costo guardado por producto"
        />
        <Metric
          label="Impuestos de tickets vigentes"
          value={shift.taxCollected}
          currency={shift.currency}
          color="text-amber-700"
        />
        <Metric
          label="Tickets / devoluciones"
          count={`${shift.ticketCount} tickets · ${formatCurrency(shift.totalRefunds, shift.currency)} devueltos`}
          currency={shift.currency}
        />
      </section>

      <section className="rounded border border-[#E5E5E5] bg-white p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E5] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide">Efectivo esperado en gaveta</h3>
          <span className="text-[11px] text-[#5C5C5C]">
            Conciliado desde movimientos persistidos
          </span>
        </div>
        <div className="grid gap-2 text-center sm:grid-cols-2 lg:grid-cols-6">
          <Equation label="Fondo inicial" value={shift.openingAmount} currency={shift.currency} />
          <Equation label="Ventas efectivo" value={shift.cashSales} currency={shift.currency} />
          <Equation
            label="Abonos clientes"
            value={shift.customerPayments}
            currency={shift.currency}
          />
          <Equation
            label="Ingresos manuales"
            value={shift.manualIncomes}
            currency={shift.currency}
          />
          <Equation
            label="Egresos / devoluciones"
            value={shift.manualExpenses + shift.cashRefunds}
            negative
            currency={shift.currency}
          />
          <Equation
            label="Esperado"
            value={shift.expectedCash}
            emphasis
            currency={shift.currency}
          />
        </div>
        {!isOpen && shift.countedCash !== undefined && (
          <p
            className={`mt-3 flex items-center justify-between rounded border p-2 text-xs ${shift.difference === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
          >
            <span className="flex items-center gap-2">
              {shift.difference === 0 ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{' '}
              Cierre: contado {formatCurrency(shift.countedCash, shift.currency)}
            </span>
            <strong>
              Diferencia {formatCurrency(Math.abs(shift.difference ?? 0), shift.currency)}
            </strong>
          </p>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded border border-[#E5E5E5] bg-white p-3">
          <h3 className="mb-3 border-b border-[#E5E5E5] pb-2 text-xs font-bold uppercase tracking-wide">
            Ventas netas por medio de pago
          </h3>
          <div className="space-y-2 text-xs">
            <Breakdown
              label="Efectivo recibido por ventas"
              amount={shift.cashSales}
              currency={shift.currency}
            />
            <Breakdown label="Tarjeta" amount={shift.cardSales} currency={shift.currency} />
            <Breakdown label="Pago mixto" amount={shift.mixedSales} currency={shift.currency} />
            <Breakdown label="Crédito" amount={shift.creditSales} currency={shift.currency} />
            <Breakdown
              label="Abonos a clientes (efectivo)"
              amount={shift.customerPayments}
              currency={shift.currency}
            />
            <Breakdown
              label="Reintegros en efectivo"
              amount={shift.cashRefunds}
              negative
              currency={shift.currency}
            />
          </div>
        </div>
        <div className="rounded border border-[#E5E5E5] bg-white">
          <div className="border-b border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-wide">Movimientos de esta caja</h3>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white text-[10px] uppercase text-[#5C5C5C]">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Tipo / concepto</th>
                  <th className="p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-7 text-center text-[#717783]">
                      Sin movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="whitespace-nowrap p-2 text-[10px] text-[#5C5C5C]">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="p-2">
                        <strong>{movement.type}</strong>
                        <span className="block text-[10px] text-[#717783]">{movement.concept}</span>
                      </td>
                      <td
                        className={`whitespace-nowrap p-2 text-right font-mono font-bold ${movement.cashEffect >= 0 ? 'text-emerald-700' : 'text-[#C42B1C]'}`}
                      >
                        {movement.cashEffect < 0 ? '-' : movement.cashEffect > 0 ? '+' : ''}
                        {formatCurrency(movement.amount, movement.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CashTicketsPanel
        tickets={tickets}
        shiftOpen={isOpen}
        canReturnSales={canReturnSales}
        onReturnSale={onReturnSale}
      />
    </>
  )
}

function Metric({
  label,
  value,
  color,
  detail,
  count,
  currency
}: {
  label: string
  value?: number
  color?: string
  detail?: string
  count?: string
  currency: CashShift['currency']
}): React.JSX.Element {
  return (
    <div className="rounded border border-[#E5E5E5] bg-white p-3">
      <span className="text-[10px] font-bold uppercase text-[#5C5C5C]">{label}</span>
      <div className={`mt-1 font-mono text-2xl font-extrabold ${color ?? 'text-[#1B1B1B]'}`}>
        {value === undefined ? count?.split(' · ')[0] : formatCurrency(value, currency)}
      </div>
      <p className="mt-1 text-[10px] text-[#717783]">
        {detail ?? count?.split(' · ').slice(1).join(' · ')}
      </p>
    </div>
  )
}

function Equation({
  label,
  value,
  negative,
  emphasis,
  currency
}: {
  label: string
  value: number
  negative?: boolean
  emphasis?: boolean
  currency: CashShift['currency']
}): React.JSX.Element {
  return (
    <div
      className={`rounded border p-2 ${emphasis ? 'border-[#0067C0]/30 bg-[#0067C0]/10' : 'border-[#E5E5E5] bg-[#F9F9F9]'}`}
    >
      <span className="block text-[10px] font-semibold text-[#5C5C5C]">{label}</span>
      <strong
        className={`mt-1 block font-mono text-sm ${negative ? 'text-[#C42B1C]' : emphasis ? 'text-[#0067C0]' : 'text-[#1B1B1B]'}`}
      >
        {negative ? '-' : ''}
        {formatCurrency(value, currency)}
      </strong>
    </div>
  )
}

function Breakdown({
  label,
  amount,
  negative,
  currency
}: {
  label: string
  amount: number
  negative?: boolean
  currency: CashShift['currency']
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-1.5">
      <span className="text-[#5C5C5C]">{label}</span>
      <strong className={`font-mono ${negative ? 'text-[#C42B1C]' : 'text-[#1B1B1B]'}`}>
        {negative ? '-' : ''}
        {formatCurrency(amount, currency)}
      </strong>
    </div>
  )
}
