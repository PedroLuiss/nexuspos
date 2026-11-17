import type { CustomerAccountSummary, ReportsData, ReportsQuery } from '@shared/contracts'
import type { AuthService } from '../auth/auth.service'
import type { CustomerService } from '../customers/customer.service'
import type {
  ReportsRepository,
  ReportDateRange,
  ReportSummary
} from '../../ports/reports.repository'

const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day)
}

function rangeFor(
  query: ReportsQuery,
  now = new Date()
): {
  current: ReportDateRange
  previous: ReportDateRange
} {
  const todayStart = localDate(now.getFullYear(), now.getMonth(), now.getDate())
  let start: Date
  let end: Date

  if (query.period === 'today') {
    start = todayStart
    end = localDate(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else if (query.period === 'week') {
    const mondayOffset = (todayStart.getDay() + 6) % 7
    start = localDate(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset)
    end = localDate(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else if (query.period === 'month') {
    start = localDate(now.getFullYear(), now.getMonth(), 1)
    end = localDate(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else {
    start = localDate(query.year, 0, 1)
    end =
      query.year === now.getFullYear()
        ? localDate(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        : localDate(query.year + 1, 0, 1)
  }

  let previousStart: Date
  let previousEnd: Date
  if (query.period === 'year') {
    previousStart = localDate(query.year - 1, 0, 1)
    previousEnd =
      query.year === now.getFullYear()
        ? localDate(query.year - 1, now.getMonth(), now.getDate() + 1)
        : start
  } else if (query.period === 'week') {
    previousStart = localDate(start.getFullYear(), start.getMonth(), start.getDate() - 7)
    previousEnd = localDate(end.getFullYear(), end.getMonth(), end.getDate() - 7)
  } else if (query.period === 'month') {
    const previousMonthStart = localDate(start.getFullYear(), start.getMonth() - 1, 1)
    const previousMonthLastDay = new Date(
      previousMonthStart.getFullYear(),
      previousMonthStart.getMonth() + 1,
      0
    ).getDate()
    previousStart = previousMonthStart
    previousEnd = localDate(
      previousMonthStart.getFullYear(),
      previousMonthStart.getMonth(),
      Math.min(now.getDate(), previousMonthLastDay) + 1
    )
  } else {
    previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    previousEnd = start
  }
  return {
    current: { start: start.toISOString(), end: end.toISOString() },
    previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() }
  }
}

function summarizeGrowth(current: ReportSummary, previous: ReportSummary): number | null {
  if (previous.totalSales <= 0) {
    return current.totalSales === previous.totalSales ? 0 : null
  }
  return money(((current.totalSales - previous.totalSales) / previous.totalSales) * 100)
}

export class ReportsService {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly auth: AuthService,
    private readonly customers: CustomerService
  ) {}

  getDashboard(query: ReportsQuery): ReportsData {
    this.requireReportsAccess()
    if (!query || typeof query !== 'object') {
      throw new Error('Los filtros del reporte no son válidos.')
    }
    if (!['today', 'week', 'month', 'year'].includes(query.period)) {
      throw new Error('El período del reporte no es válido.')
    }
    if (!['day', 'week', 'month', 'year'].includes(query.grouping)) {
      throw new Error('La agrupación del gráfico no es válida.')
    }
    if (!Number.isInteger(query.year) || query.year < 2000 || query.year > 9999) {
      throw new Error('El año del reporte no es válido.')
    }

    const { current, previous } = rangeFor(query)
    const summary = this.reports.getSummary(current)
    const previousSummary = this.reports.getSummary(previous)
    const availableYears = this.reports.getAvailableYears()
    const currentYear = new Date().getFullYear()
    if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear)
    if (query.period === 'year' && !availableYears.includes(query.year)) {
      availableYears.push(query.year)
      availableYears.sort((a, b) => b - a)
    }

    return {
      period: query.period,
      year: query.year,
      rangeStart: current.start,
      rangeEnd: current.end,
      availableYears,
      kpis: {
        totalSales: summary.totalSales,
        grossSales: summary.grossSales,
        grossProfit: summary.grossProfit,
        averageTicket:
          summary.transactionCount === 0 ? 0 : money(summary.grossSales / summary.transactionCount),
        transactionCount: summary.transactionCount,
        growthPercent: summarizeGrowth(summary, previousSummary),
        returnedCount: summary.returnedCount,
        returnedAmount: summary.returnedAmount,
        marginPercent:
          summary.netRevenue === 0 ? 0 : money((summary.grossProfit / summary.netRevenue) * 100)
      },
      series: this.fillMissingBuckets(
        this.reports.getSeries(current, query.grouping),
        current,
        query.grouping
      ),
      topProducts: this.reports.getTopProducts(current),
      topCustomers: this.reports.getTopCustomers(current),
      payments: summary.payments
    }
  }

  getCustomerDetail(customerId: string): CustomerAccountSummary | null {
    this.requireReportsAccess()
    if (typeof customerId !== 'string' || !customerId.trim()) {
      throw new Error('El cliente solicitado no es válido.')
    }
    return this.customers.getAccountSummary(customerId)
  }

  private requireReportsAccess(): void {
    const user = this.auth.getSessionUser()
    if (!user) throw new Error('Debe iniciar sesión para consultar reportes.')
    if (user.role !== 'ADMIN' && !user.permissions?.includes('reports')) {
      throw new Error('No tiene permiso para consultar reportes.')
    }
  }

  private fillMissingBuckets(
    series: ReportsData['series'],
    range: ReportDateRange,
    grouping: ReportsQuery['grouping']
  ): ReportsData['series'] {
    const existing = new Map(series.map((point) => [point.bucket, point]))
    const start = new Date(range.start)
    const end = new Date(range.end)
    const buckets = new Set<string>()
    const cursor = localDate(start.getFullYear(), start.getMonth(), start.getDate())

    while (cursor < end) {
      if (grouping === 'day') {
        buckets.add(
          `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
        )
      } else if (grouping === 'week') {
        const year = cursor.getFullYear()
        const yearStart = localDate(year, 0, 1)
        const dayOfYear =
          Math.floor(
            (Date.UTC(year, cursor.getMonth(), cursor.getDate()) - Date.UTC(year, 0, 1)) / 86400000
          ) + 1
        const mondayOffset = (yearStart.getDay() + 6) % 7
        const week = Math.floor((dayOfYear - 1 + mondayOffset) / 7) + (mondayOffset === 0 ? 1 : 0)
        buckets.add(`${year}-W${String(week).padStart(2, '0')}`)
      } else if (grouping === 'month') {
        buckets.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
      } else {
        buckets.add(String(cursor.getFullYear()))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    return [...buckets].sort().map(
      (bucket) =>
        existing.get(bucket) ?? {
          bucket,
          totalSales: 0,
          grossProfit: 0,
          ticketCount: 0
        }
    )
  }
}
