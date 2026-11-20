import { useState } from 'react'
import type { CashTicket } from '@shared/contracts'
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog'
import { formatCurrency } from '../../../shared/lib/currency'
import { CashTicketsPagination } from './CashTicketsPagination'

const PAGE_SIZE = 10

interface CashTicketsPanelProps {
  tickets: CashTicket[]
  shiftOpen: boolean
  canReturnSales: boolean
  onReturnSale: (saleId: string) => Promise<boolean>
}

function paymentLabel(ticket: CashTicket): string {
  if (ticket.payment.method === 'mixed') return 'Mixto'
  if (ticket.payment.method === 'credit') return 'Crédito'
  return ticket.payment.method === 'card' ? 'Tarjeta' : 'Efectivo'
}

export function CashTicketsPanel({
  tickets,
  shiftOpen,
  canReturnSales,
  onReturnSale
}: CashTicketsPanelProps): React.JSX.Element {
  const [selectedTicket, setSelectedTicket] = useState<CashTicket | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoiceCode, setInvoiceCode] = useState('')
  const [page, setPage] = useState(1)
  const confirmation = useConfirmDialog()
  const matchingTickets = tickets.filter((ticket) =>
    ticket.ticketNumber.toLocaleLowerCase().includes(invoiceCode.trim().toLocaleLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(matchingTickets.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedTickets = matchingTickets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleReturn = async (): Promise<void> => {
    if (!selectedTicket) return
    const confirmed = await confirmation.confirm({
      title: 'Confirmar devolución de factura',
      message: (
        <p>
          ¿Confirmas la devolución completa de la factura{' '}
          <strong>{selectedTicket.ticketNumber}</strong>? Se repondrá el inventario y se registrará
          el reintegro según el método de pago original.
        </p>
      ),
      confirmLabel: 'Devolver factura'
    })
    if (!confirmed) return

    setIsReturning(true)
    setError(null)
    try {
      if (await onReturnSale(selectedTicket.id)) {
        setSelectedTicket(null)
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setIsReturning(false)
    }
  }

  return (
    <section className="flex min-h-64 flex-col overflow-hidden rounded border border-[#E5E5E5] bg-white">
      <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#1B1B1B]">
          Facturas de esta caja
        </h3>
        <span className="text-[11px] text-[#5C5C5C]">
          {matchingTickets.length} de {tickets.length} facturas
        </span>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E5] px-3 py-2">
        <label className="flex min-w-56 flex-1 items-center gap-2 text-[11px] font-semibold text-[#5C5C5C]">
          Código de factura
          <input
            type="search"
            value={invoiceCode}
            onChange={(event) => {
              setInvoiceCode(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar por número..."
            aria-label="Filtrar facturas por código"
            className="min-w-0 flex-1 rounded border border-[#D1D1D1] bg-white px-2 py-1.5 text-xs font-normal text-[#1B1B1B]"
          />
        </label>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 border-b border-[#E5E5E5] bg-white text-[10px] uppercase text-[#5C5C5C]">
            <tr>
              <th className="px-3 py-2">Ticket / Fecha</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-9 text-center text-[#717783]">
                  {tickets.length === 0
                    ? 'Esta caja todavía no tiene facturas.'
                    : 'No hay facturas que coincidan con ese código.'}
                </td>
              </tr>
            ) : (
              paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-[#F9F9F9]">
                  <td className="px-3 py-2">
                    <strong className="block font-mono">{ticket.ticketNumber}</strong>
                    <span className="text-[10px] text-[#717783]">
                      {new Date(ticket.soldAt).toLocaleString('es-VE')}
                    </span>
                  </td>
                  <td className="px-3 py-2">{ticket.customerName ?? 'Consumidor final'}</td>
                  <td className="px-3 py-2">{paymentLabel(ticket)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">
                    {formatCurrency(ticket.total, ticket.currency)}
                  </td>
                  <td className="px-3 py-2">
                    {ticket.returnedAt ? (
                      <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        DEVUELTA
                      </span>
                    ) : (
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        COBRADA
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setSelectedTicket(ticket)
                      }}
                      className="rounded border border-[#D1D1D1] bg-white px-2 py-1 text-[11px] font-semibold hover:bg-[#F3F3F3]"
                    >
                      Ver factura
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <CashTicketsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded border border-[#D1D1D1] bg-white shadow-xl">
            <header className="flex items-start justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
              <div>
                <h3 className="text-sm font-bold">Factura {selectedTicket.ticketNumber}</h3>
                <p className="text-xs text-[#5C5C5C]">
                  {new Date(selectedTicket.soldAt).toLocaleString('es-VE')} ·{' '}
                  {selectedTicket.cashierName}
                </p>
              </div>
              <button
                type="button"
                disabled={isReturning}
                onClick={() => {
                  setSelectedTicket(null)
                }}
                aria-label="Cerrar factura"
                className="px-2 text-lg text-[#5C5C5C]"
              >
                ×
              </button>
            </header>
            <div className="max-h-[55vh] overflow-auto p-4">
              <p className="mb-3 text-xs text-[#5C5C5C]">
                Cliente: {selectedTicket.customerName ?? 'Consumidor final'} · Pago:{' '}
                {paymentLabel(selectedTicket)}
              </p>
              <table className="w-full text-xs">
                <thead className="border-b border-[#E5E5E5] text-left text-[10px] uppercase text-[#5C5C5C]">
                  <tr>
                    <th className="py-2">Producto</th>
                    <th className="py-2 text-right">Cant.</th>
                    <th className="py-2 text-right">Precio</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {selectedTicket.items.map((item) => (
                    <tr key={`${selectedTicket.id}-${item.productId}`}>
                      <td className="py-2">
                        {item.productName}
                        <span className="block text-[10px] text-[#717783]">{item.productCode}</span>
                      </td>
                      <td className="py-2 text-right font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">
                        {formatCurrency(item.unitPrice, selectedTicket.currency)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatCurrency(item.lineTotal, selectedTicket.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="ml-auto mt-3 max-w-xs space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(selectedTicket.subtotal, selectedTicket.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Descuentos</dt>
                  <dd>-{formatCurrency(selectedTicket.discount, selectedTicket.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Impuestos</dt>
                  <dd>{formatCurrency(selectedTicket.tax, selectedTicket.currency)}</dd>
                </div>
                <div className="flex justify-between border-t border-[#E5E5E5] pt-1 text-sm font-bold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(selectedTicket.total, selectedTicket.currency)}</dd>
                </div>
              </dl>
              {selectedTicket.returnedAt && (
                <p className="mt-3 rounded bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                  Factura devuelta el {new Date(selectedTicket.returnedAt).toLocaleString('es-VE')}.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-3 text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
              {shiftOpen && canReturnSales && !selectedTicket.returnedAt && (
                <button
                  type="button"
                  disabled={isReturning}
                  onClick={() => void handleReturn()}
                  className="rounded bg-[#C42B1C] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {isReturning ? 'Procesando…' : 'Devolver factura completa'}
                </button>
              )}
              <button
                type="button"
                disabled={isReturning}
                onClick={() => setSelectedTicket(null)}
                className="rounded border border-[#D1D1D1] px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
      {confirmation.dialog}
    </section>
  )
}
