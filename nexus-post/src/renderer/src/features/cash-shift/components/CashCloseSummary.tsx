import type { CashShift } from '@shared/contracts'

interface CashCloseSummaryProps {
  shift: CashShift
}

const money = (value: number): string => `$${value.toFixed(2)}`

export function CashCloseSummary({ shift }: CashCloseSummaryProps): React.JSX.Element {
  return (
    <section
      aria-label="Resumen del arqueo de caja"
      className="space-y-3 rounded border border-[#D1D1D1] bg-[#F9F9F9] p-3"
    >
      <div className="flex items-center justify-between gap-3 rounded border border-[#0067C0]/20 bg-[#0067C0]/5 px-3 py-2">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5C5C]">
            Efectivo esperado en gaveta
          </span>
          <span className="text-[10px] text-[#717783]">Según los movimientos registrados</span>
        </div>
        <strong className="font-mono text-xl text-[#0067C0]">{money(shift.expectedCash)}</strong>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <CashLine label="Fondo inicial" amount={shift.openingAmount} />
        <CashLine label="Efectivo de ventas" amount={shift.cashSales} />
        <CashLine label="Abonos de clientes" amount={shift.customerPayments} />
        <CashLine label="Ingresos manuales" amount={shift.manualIncomes} />
        <CashLine label="Gastos manuales" amount={shift.manualExpenses} negative />
        <CashLine label="Devoluciones en efectivo" amount={shift.cashRefunds} negative />
        <div className="col-span-2 flex justify-between border-t border-[#D1D1D1] pt-2 font-bold">
          <dt>Tickets emitidos</dt>
          <dd>{shift.ticketCount}</dd>
        </div>
      </dl>

      <p className="rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-relaxed text-amber-900">
        Cuenta el efectivo físico, incluido el fondo inicial. No sumes pagos con tarjeta ni ventas a
        crédito: no forman parte del dinero en gaveta. Verifica también los comprobantes y los
        movimientos registrados.
      </p>
    </section>
  )
}

function CashLine({
  label,
  amount,
  negative = false
}: {
  label: string
  amount: number
  negative?: boolean
}): React.JSX.Element {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[#5C5C5C]">{label}</dt>
      <dd className={`font-mono font-semibold ${negative ? 'text-[#C42B1C]' : 'text-[#1B1B1B]'}`}>
        {negative ? '-' : '+'}
        {money(amount)}
      </dd>
    </div>
  )
}
