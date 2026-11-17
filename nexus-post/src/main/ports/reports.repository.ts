import type {
  ReportGrouping,
  ReportPaymentBreakdown,
  ReportSeriesPoint,
  TopCustomer,
  TopSellingProduct
} from '@shared/contracts'

export interface ReportDateRange {
  start: string
  end: string
}

export interface ReportSummary {
  totalSales: number
  grossSales: number
  netRevenue: number
  grossProfit: number
  transactionCount: number
  returnedCount: number
  returnedAmount: number
  payments: ReportPaymentBreakdown
}

export interface ReportsRepository {
  getAvailableYears(): number[]
  getSummary(range: ReportDateRange): ReportSummary
  getSeries(range: ReportDateRange, grouping: ReportGrouping): ReportSeriesPoint[]
  getTopProducts(range: ReportDateRange): TopSellingProduct[]
  getTopCustomers(range: ReportDateRange): TopCustomer[]
}
