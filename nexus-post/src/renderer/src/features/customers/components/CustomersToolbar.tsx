import type { JSX } from 'react'
import { Archive, Plus, RefreshCw, Search, Users } from '../../../shared/icons/Icons'

export type CustomerStatusFilter = 'ALL' | 'DEBTORS' | 'UP_TO_DATE'

interface CustomersToolbarProps {
  searchTerm: string
  statusFilter: CustomerStatusFilter
  showDeactivated: boolean
  activeCount: number
  debtorCount: number
  resultCount: number
  canManageCustomers: boolean
  isRefreshing: boolean
  onSearchChange: (value: string) => void
  onStatusFilterChange: (filter: CustomerStatusFilter) => void
  onToggleDeactivated: () => void
  onCreateCustomer: () => void
  onRefresh: () => void
}

export function CustomersToolbar({
  searchTerm,
  statusFilter,
  showDeactivated,
  activeCount,
  debtorCount,
  resultCount,
  canManageCustomers,
  isRefreshing,
  onSearchChange,
  onStatusFilterChange,
  onToggleDeactivated,
  onCreateCustomer,
  onRefresh
}: CustomersToolbarProps): JSX.Element {
  const filters: { value: CustomerStatusFilter; label: string }[] = [
    { value: 'ALL', label: `Todos (${activeCount})` },
    { value: 'DEBTORS', label: `Con deuda (${debtorCount})` },
    { value: 'UP_TO_DATE', label: 'Al día' }
  ]

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <label className="relative min-w-[240px] flex-1 xl:max-w-md">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nombre, código, RFC, teléfono o correo..."
            aria-label="Buscar clientes"
            className="w-full rounded-md border border-[#D1D1D1] bg-[#F9F9F9] py-2 pl-9 pr-3 text-xs text-[#1B1B1B] outline-none transition focus:border-[#0067C0] focus:bg-white focus:ring-2 focus:ring-[#0067C0]/15"
          />
        </label>

        {!showDeactivated && (
          <div
            aria-label="Filtrar clientes"
            className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5E5E5] bg-[#F3F3F3] p-1"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={statusFilter === filter.value}
                onClick={() => onStatusFilterChange(filter.value)}
                className={`rounded px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  statusFilter === filter.value
                    ? 'bg-white text-[#0067C0] shadow-sm'
                    : 'text-[#5C5C5C] hover:bg-white/70'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] text-[#717783]">
          {resultCount} {showDeactivated ? 'desactivados' : 'clientes'}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Actualizar listado"
          className="inline-flex items-center gap-2 rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-xs font-semibold text-[#5C5C5C] transition hover:bg-[#F9F9F9] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
        <button
          type="button"
          onClick={onToggleDeactivated}
          aria-pressed={showDeactivated}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
            showDeactivated
              ? 'border-[#0067C0]/30 bg-blue-50 text-[#0067C0]'
              : 'border-[#D1D1D1] bg-white text-[#5C5C5C] hover:bg-[#F9F9F9]'
          }`}
        >
          {showDeactivated ? <Users size={14} /> : <Archive size={14} />}
          {showDeactivated ? 'Ver activos' : 'Clientes desactivados'}
        </button>
        {canManageCustomers && !showDeactivated && (
          <button
            type="button"
            onClick={onCreateCustomer}
            className="inline-flex items-center gap-2 rounded-md bg-[#0067C0] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0078D4]"
          >
            <Plus size={15} />
            Nuevo cliente
            <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px]">ALT+C</span>
          </button>
        )}
      </div>
    </section>
  )
}
