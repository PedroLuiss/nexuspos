import type { JSX } from 'react'
import { ShieldCheck, Users } from '../../../shared/icons/Icons'

interface CustomersHeaderProps {
  canManageCustomers: boolean
  canReceivePayments: boolean
}

export function CustomersHeader({
  canManageCustomers,
  canReceivePayments
}: CustomersHeaderProps): JSX.Element {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="rounded-lg border border-[#D1D1D1] bg-white p-2.5 text-[#0067C0] shadow-sm">
          <Users size={20} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#717783]">
            Gestión comercial
          </p>
          <h1 className="text-lg font-bold tracking-tight text-[#1B1B1B]">Clientes y crédito</h1>
          <p className="text-xs text-[#717783]">
            Directorio, cuentas por cobrar y seguimiento de abonos.
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5C5C5C]">
        <ShieldCheck size={13} className="text-[#107C41]" />
        {canManageCustomers
          ? 'Administración completa'
          : canReceivePayments
            ? 'Operación de cobranza'
            : 'Consulta'}
      </span>
    </header>
  )
}
