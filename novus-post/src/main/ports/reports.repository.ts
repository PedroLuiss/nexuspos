import type {
  CurrencyCode,
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

export interface ReportCurrencyContext {
  currency: CurrencyCode
  targetVesRate: number
  usdVesRate: number
  eurVesRate: number
}

export interface ReportsRepository {
  getAvailableYears(): number[]
  getCurrencies(range: ReportDateRange): CurrencyCode[]
  getCurrenciesWithoutRate(range: ReportDateRange): CurrencyCode[]
  getSummary(range: ReportDateRange, context: ReportCurrencyContext): ReportSummary
  getSeries(
    range: ReportDateRange,
    grouping: ReportGrouping,
    context: ReportCurrencyContext
  ): ReportSeriesPoint[]
  getTopProducts(range: ReportDateRange, context: ReportCurrencyContext): TopSellingProduct[]
  getTopCustomers(range: ReportDateRange, context: ReportCurrencyContext): TopCustomer[]
}
