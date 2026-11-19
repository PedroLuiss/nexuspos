import type { JSX } from 'react'
import type { Customer } from '@shared/contracts'
import { AlertCircle, CheckCircle2, Clock, Users } from '../../../shared/icons/Icons'

interface CustomersMetricsProps {
  customers: Customer[]
  deactivatedCount: number
}

export function CustomersMetrics({
  customers,
  deactivatedCount
}: CustomersMetricsProps): JSX.Element {
  const active = customers.filter((customer) => customer.active)
  const debtors = active.filter((customer) => customer.currentDebt > 0)
  const totalDebt = active.reduce((total, customer) => total + customer.currentDebt, 0)
  const metrics = [
    {
      label: 'Clientes activos',
      value: String(active.length),
      description: `${deactivatedCount} clientes desactivados`,
      icon: Users,
      color: 'text-[#0067C0]',
      iconBackground: 'bg-blue-50'
    },
    {
      label: 'Cuentas por cobrar',
      value: `$${totalDebt.toFixed(2)}`,
      description: 'Saldo pendiente de recuperación',
      icon: AlertCircle,
      color: 'text-[#C42B1C]',
      iconBackground: 'bg-red-50'
    },
    {
      label: 'Clientes con deuda',
      value: String(debtors.length),
      description: 'Cuentas con saldo pendiente',
      icon: Clock,
      color: 'text-amber-700',
      iconBackground: 'bg-amber-50'
    },
    {
      label: 'Clientes al día',
      value: String(active.length - debtors.length),
      description: 'Sin deuda vigente',
      icon: CheckCircle2,
      color: 'text-[#107C41]',
      iconBackground: 'bg-emerald-50'
    }
  ]

  return (
    <section
      aria-label="Indicadores de clientes"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map(({ label, value, description, icon: Icon, color, iconBackground }) => (
        <article
          key={label}
          className="flex items-start justify-between rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#717783]">{label}</p>
            <p className={`mt-2 font-mono text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-[11px] text-[#717783]">{description}</p>
          </div>
          <span className={`rounded-md p-2 ${iconBackground} ${color}`}>
            <Icon size={18} />
          </span>
        </article>
      ))}
    </section>
  )
}
