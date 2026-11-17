import type { CustomerAccountSummary } from './customer.contract'

export type ReportPeriod = 'today' | 'week' | 'month' | 'year'
export type ReportGrouping = 'day' | 'week' | 'month' | 'year'

export interface ReportsQuery {
  period: ReportPeriod
  year: number
  grouping: ReportGrouping
}

export interface ReportKpis {
  totalSales: number
  grossSales: number
  grossProfit: number
  averageTicket: number
  transactionCount: number
  growthPercent: number | null
  returnedCount: number
  returnedAmount: number
  marginPercent: number
}

export interface ReportSeriesPoint {
  bucket: string
  totalSales: number
  grossProfit: number
  ticketCount: number
}

export interface TopSellingProduct {
  productId: string
  productName: string
  productCode: string
  unitsSold: number
  revenue: number
}

export interface TopCustomer {
  customerId: string
  customerName: string
  purchaseCount: number
  totalSpent: number
}

export interface ReportPaymentBreakdown {
  cash: number
  card: number
  credit: number
}

export interface ReportsData {
  period: ReportPeriod
  year: number
  rangeStart: string
  rangeEnd: string
  availableYears: number[]
  kpis: ReportKpis
  series: ReportSeriesPoint[]
  topProducts: TopSellingProduct[]
  topCustomers: TopCustomer[]
  payments: ReportPaymentBreakdown
}

export interface ReportsApi {
  getDashboard(query: ReportsQuery): Promise<ReportsData>
  getCustomerDetail(customerId: string): Promise<CustomerAccountSummary | null>
}
