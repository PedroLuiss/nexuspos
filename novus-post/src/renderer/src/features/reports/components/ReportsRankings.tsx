import { useState } from 'react'
import type {
  CustomerAccountSummary,
  ReportsData,
  TopCustomer,
  CurrencyVesExchangeRate
} from '@shared/contracts'
import { reportsApi, reportsErrorMessage } from '../api/reports.api'
import { CustomerReportDetail } from './CustomerReportDetail'
import { ReportMoney } from './ReportMoney'

interface ReportsRankingsProps {
  data: ReportsData
  rate: CurrencyVesExchangeRate | null
}

export function ReportsRankings({ data, rate }: ReportsRankingsProps): React.JSX.Element {
  const [selectedCustomer, setSelectedCustomer] = useState<TopCustomer | null>(null)
  const [account, setAccount] = useState<CustomerAccountSummary | null>(null)
  const [loadingCustomerId, setLoadingCustomerId] = useState<string | null>(null)
  const [customerError, setCustomerError] = useState<string | null>(null)

  async function viewCustomer(customer: TopCustomer): Promise<void> {
    setSelectedCustomer(customer)
    setAccount(null)
    setCustomerError(null)
    setLoadingCustomerId(customer.customerId)
    try {
      const result = await reportsApi.getCustomerDetail(customer.customerId)
      if (!result) {
        setCustomerError('El cliente ya no está disponible en la base de datos.')
        return
      }
      setAccount(result)
    } catch (error) {
      setCustomerError(reportsErrorMessage(error))
    } finally {
      setLoadingCustomerId(null)
    }
  }

  function closeCustomer(): void {
    setSelectedCustomer(null)
    setAccount(null)
    setCustomerError(null)
  }

  return (
    <>
      <div className="grid gap-3 xl:grid-cols-2">
        <section className="rounded border border-[#E5E5E5] bg-white p-4">
          <header className="mb-3 border-b border-[#E5E5E5] pb-2">
            <h3 className="text-xs font-bold uppercase">Top 5 productos más vendidos</h3>
            <p className="text-[11px] text-[#5C5C5C]">
              Unidades netas; el ingreso de productos no incluye impuestos
            </p>
          </header>
          {data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#717783]">
              No hay ventas de productos en el período.
            </p>
          ) : (
            <ol className="space-y-2">
              {data.topProducts.map((product, index) => (
                <li
                  key={`${product.productId}-${product.productCode}`}
                  className="flex items-center justify-between gap-3 rounded border border-[#E5E5E5] bg-[#F9F9F9] p-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0067C0]/10 font-mono text-xs font-bold text-[#0067C0]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{product.productName}</p>
                      <p className="font-mono text-[10px] text-[#717783]">{product.productCode}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <strong className="block font-mono text-xs">
                      {product.unitsSold} unidades
                    </strong>
                    <ReportMoney amount={product.revenue} rate={rate} currency={data.currency} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded border border-[#E5E5E5] bg-white p-4">
          <header className="mb-3 border-b border-[#E5E5E5] pb-2">
            <h3 className="text-xs font-bold uppercase">Clientes que más compran</h3>
            <p className="text-[11px] text-[#5C5C5C]">
              Gasto neto en el período · compras asociadas a clientes registrados
            </p>
          </header>
          {data.topCustomers.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#717783]">
              No hay ventas asociadas a clientes en el período.
            </p>
          ) : (
            <ol className="space-y-2">
              {data.topCustomers.map((customer, index) => (
                <li
                  key={customer.customerId}
                  className="flex items-center justify-between gap-3 rounded border border-[#E5E5E5] bg-[#F9F9F9] p-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-50 font-mono text-xs font-bold text-purple-700">
                      {index + 1}
                    </span>
                    <span className="truncate text-xs font-semibold">{customer.customerName}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <ReportMoney amount={customer.totalSpent} rate={rate} currency={data.currency} />
                    <span className="text-[10px] text-[#5C5C5C]">
                      {customer.purchaseCount}{' '}
                      {customer.purchaseCount === 1 ? 'factura emitida' : 'facturas emitidas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void viewCustomer(customer)}
                      disabled={loadingCustomerId !== null}
                      className="mt-1 block text-[10px] font-semibold text-[#0067C0] hover:underline disabled:opacity-50"
                    >
                      Ver cliente
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      <CustomerReportDetail
        customerName={selectedCustomer?.customerName ?? ''}
        account={account}
        rate={rate}
        loading={loadingCustomerId !== null}
        error={customerError}
        onClose={closeCustomer}
      />
    </>
  )
}
