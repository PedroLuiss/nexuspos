import type Database from 'better-sqlite3'
import type {
  ReportGrouping,
  ReportSeriesPoint,
  TopCustomer,
  TopSellingProduct
} from '@shared/contracts'
import type {
  ReportDateRange,
  ReportSummary,
  ReportsRepository
} from '../../../ports/reports.repository'

interface SummaryRow {
  gross_sales: number | null
  refunds: number | null
  total_sales: number | null
  net_revenue: number | null
  gross_profit: number | null
  transaction_count: number
  returned_count: number
  cash: number | null
  card: number | null
  credit: number | null
}

interface SeriesRow {
  bucket: string
  total_sales: number
  gross_profit: number
  ticket_count: number
}

const money = (value: number | null): number =>
  Math.round(((value ?? 0) + Number.EPSILON) * 100) / 100

export class SqliteReportsRepository implements ReportsRepository {
  constructor(private readonly db: Database.Database) {}

  getAvailableYears(): number[] {
    const rows = this.db
      .prepare(
        `SELECT year FROM (
           SELECT CAST(strftime('%Y', sold_at, 'localtime') AS INTEGER) AS year FROM sales
           UNION
           SELECT CAST(strftime('%Y', returned_at, 'localtime') AS INTEGER) AS year
           FROM sale_refunds
         ) WHERE year IS NOT NULL ORDER BY year DESC`
      )
      .all() as Array<{ year: number | null }>
    return rows.flatMap((row) => (row.year ? [row.year] : []))
  }

  getSummary(range: ReportDateRange): ReportSummary {
    const row = this.db
      .prepare(
        `WITH sale_totals AS (
           SELECT
             COALESCE(SUM(CAST(ROUND(s.total * 100) AS INTEGER)), 0) AS gross_sales_cents,
             COALESCE(SUM(CAST(ROUND((s.total - s.tax) * 100) AS INTEGER)), 0) AS net_revenue_cents,
             COUNT(*) AS transaction_count,
             COALESCE(SUM(CASE json_extract(s.payment_json, '$.method')
               WHEN 'cash' THEN CAST(ROUND(s.total * 100) AS INTEGER)
               WHEN 'mixed' THEN CAST(ROUND(CAST(COALESCE(
                 json_extract(s.payment_json, '$.cashAmount'), 0
               ) AS REAL) * 100) AS INTEGER)
               ELSE 0 END), 0) AS cash_cents,
             COALESCE(SUM(CASE json_extract(s.payment_json, '$.method')
               WHEN 'card' THEN CAST(ROUND(s.total * 100) AS INTEGER)
               WHEN 'mixed' THEN CAST(ROUND(CAST(COALESCE(
                 json_extract(s.payment_json, '$.cardAmount'), 0
               ) AS REAL) * 100) AS INTEGER)
               ELSE 0 END), 0) AS card_cents,
             COALESCE(SUM(CASE json_extract(s.payment_json, '$.method')
               WHEN 'credit' THEN CAST(ROUND(s.total * 100) AS INTEGER) ELSE 0 END), 0) AS credit_cents
           FROM sales s
           WHERE s.sold_at >= @start AND s.sold_at < @end
         ), sale_costs AS (
           SELECT sale_id,
             COALESCE(SUM(CAST(ROUND(unit_cost * quantity * 100) AS INTEGER)), 0) AS cost_cents
           FROM sale_items
           GROUP BY sale_id
         ), sale_profit AS (
           SELECT COALESCE(SUM(
             CAST(ROUND((s.total - s.tax) * 100) AS INTEGER) - COALESCE(sc.cost_cents, 0)
           ), 0) AS profit_cents
           FROM sales s
           LEFT JOIN sale_costs sc ON sc.sale_id = s.id
           WHERE s.sold_at >= @start AND s.sold_at < @end
         ), refund_totals AS (
           SELECT
             COALESCE(SUM(CAST(ROUND(r.amount * 100) AS INTEGER)), 0) AS refund_cents,
             COALESCE(SUM(CAST(ROUND((
               r.amount - r.amount * s.tax / NULLIF(s.total, 0)
             ) * 100) AS INTEGER)), 0) AS refund_net_cents,
             COUNT(*) AS returned_count,
             COALESCE(SUM(CASE json_extract(r.payment_json, '$.method')
               WHEN 'cash' THEN CAST(ROUND(r.amount * 100) AS INTEGER)
               WHEN 'mixed' THEN CAST(ROUND(CAST(COALESCE(
                 json_extract(r.payment_json, '$.cashAmount'), 0
               ) AS REAL) * 100) AS INTEGER)
               ELSE 0 END), 0) AS cash_refund_cents,
             COALESCE(SUM(CASE json_extract(r.payment_json, '$.method')
               WHEN 'card' THEN CAST(ROUND(r.amount * 100) AS INTEGER)
               WHEN 'mixed' THEN CAST(ROUND(CAST(COALESCE(
                 json_extract(r.payment_json, '$.cardAmount'), 0
               ) AS REAL) * 100) AS INTEGER)
               ELSE 0 END), 0) AS card_refund_cents,
             COALESCE(SUM(CASE json_extract(r.payment_json, '$.method')
               WHEN 'credit' THEN CAST(ROUND(r.amount * 100) AS INTEGER) ELSE 0 END), 0) AS credit_refund_cents
           FROM sale_refunds r
           JOIN sales s ON s.id = r.sale_id
           WHERE r.returned_at >= @start AND r.returned_at < @end
         ), refund_profit AS (
           SELECT COALESCE(SUM(
             CAST(ROUND((s.total - s.tax) * 100) AS INTEGER) - COALESCE(sc.cost_cents, 0)
           ), 0) AS profit_cents
           FROM sale_refunds r
           JOIN sales s ON s.id = r.sale_id
           LEFT JOIN sale_costs sc ON sc.sale_id = s.id
           WHERE r.returned_at >= @start AND r.returned_at < @end
         )
         SELECT
           sale_totals.gross_sales_cents / 100.0 AS gross_sales,
           refund_totals.refund_cents / 100.0 AS refunds,
           (sale_totals.gross_sales_cents - refund_totals.refund_cents) / 100.0 AS total_sales,
           (sale_totals.net_revenue_cents - refund_totals.refund_net_cents) / 100.0 AS net_revenue,
           (sale_profit.profit_cents - refund_profit.profit_cents) / 100.0 AS gross_profit,
           sale_totals.transaction_count AS transaction_count,
           refund_totals.returned_count AS returned_count,
           (sale_totals.cash_cents - refund_totals.cash_refund_cents) / 100.0 AS cash,
           (sale_totals.card_cents - refund_totals.card_refund_cents) / 100.0 AS card,
           (sale_totals.credit_cents - refund_totals.credit_refund_cents) / 100.0 AS credit
         FROM sale_totals, sale_profit, refund_totals, refund_profit`
      )
      .get(range) as SummaryRow

    return {
      totalSales: money(row.total_sales),
      grossSales: money(row.gross_sales),
      netRevenue: money(row.net_revenue),
      grossProfit: money(row.gross_profit),
      transactionCount: row.transaction_count,
      returnedCount: row.returned_count,
      returnedAmount: money(row.refunds),
      payments: {
        cash: money(row.cash),
        card: money(row.card),
        credit: money(row.credit)
      }
    }
  }

  getSeries(range: ReportDateRange, grouping: ReportGrouping): ReportSeriesPoint[] {
    const bucketExpression: Record<ReportGrouping, string> = {
      day: "date(event_at, 'localtime')",
      week: "strftime('%Y-W%W', event_at, 'localtime')",
      month: "strftime('%Y-%m', event_at, 'localtime')",
      year: "strftime('%Y', event_at, 'localtime')"
    }
    const rows = this.db
      .prepare(
        `WITH events AS (
           SELECT s.sold_at AS event_at, CAST(ROUND(s.total * 100) AS INTEGER) AS sales_cents,
             CAST(ROUND((s.total - s.tax) * 100) AS INTEGER) - COALESCE((
               SELECT SUM(CAST(ROUND(si.unit_cost * si.quantity * 100) AS INTEGER))
               FROM sale_items si WHERE si.sale_id = s.id
             ), 0) AS profit_cents, 1 AS ticket_count
           FROM sales s
           WHERE s.sold_at >= @start AND s.sold_at < @end
           UNION ALL
           SELECT r.returned_at AS event_at, -CAST(ROUND(r.amount * 100) AS INTEGER) AS sales_cents,
             -(CAST(ROUND((s.total - s.tax) * 100) AS INTEGER) - COALESCE((
               SELECT SUM(CAST(ROUND(si.unit_cost * si.quantity * 100) AS INTEGER))
               FROM sale_items si WHERE si.sale_id = s.id
             ), 0)) AS profit_cents, 0 AS ticket_count
           FROM sale_refunds r
           JOIN sales s ON s.id = r.sale_id
           WHERE r.returned_at >= @start AND r.returned_at < @end
         )
         SELECT ${bucketExpression[grouping]} AS bucket,
           COALESCE(SUM(sales_cents), 0) / 100.0 AS total_sales,
           COALESCE(SUM(profit_cents), 0) / 100.0 AS gross_profit,
           SUM(ticket_count) AS ticket_count
         FROM events GROUP BY bucket ORDER BY bucket`
      )
      .all(range) as SeriesRow[]
    return rows.map((row) => ({
      bucket: row.bucket,
      totalSales: money(row.total_sales),
      grossProfit: money(row.gross_profit),
      ticketCount: row.ticket_count
    }))
  }

  getTopProducts(range: ReportDateRange): TopSellingProduct[] {
    const rows = this.db
      .prepare(
        `WITH product_events AS (
           SELECT si.product_id, si.product_name, si.product_code,
             si.quantity AS units,
             CAST(ROUND(
               si.line_total * (s.total - s.tax) * 100 /
               NULLIF((SELECT SUM(sii.line_total) FROM sale_items sii WHERE sii.sale_id = s.id), 0)
             ) AS INTEGER) AS revenue_cents
           FROM sale_items si
           JOIN sales s ON s.id = si.sale_id
           WHERE s.sold_at >= @start AND s.sold_at < @end
           UNION ALL
           SELECT si.product_id, si.product_name, si.product_code,
             -si.quantity AS units,
             -CAST(ROUND(
               si.line_total * (s.total - s.tax) * 100 /
               NULLIF((SELECT SUM(sii.line_total) FROM sale_items sii WHERE sii.sale_id = s.id), 0)
             ) AS INTEGER) AS revenue_cents
           FROM sale_refunds r
           JOIN sales s ON s.id = r.sale_id
           JOIN sale_items si ON si.sale_id = s.id
           WHERE r.returned_at >= @start AND r.returned_at < @end
         )
         SELECT product_id AS productId, product_name AS productName,
           product_code AS productCode, SUM(units) AS unitsSold,
           SUM(revenue_cents) / 100.0 AS revenue
         FROM product_events
         GROUP BY product_id, product_name, product_code
         HAVING SUM(units) > 0
         ORDER BY unitsSold DESC, revenue DESC LIMIT 5`
      )
      .all(range) as TopSellingProduct[]
    return rows.map((row) => ({ ...row, revenue: money(row.revenue) }))
  }

  getTopCustomers(range: ReportDateRange): TopCustomer[] {
    return this.db
      .prepare(
        `WITH customer_events AS (
           SELECT s.customer_id, CAST(ROUND(s.total * 100) AS INTEGER) AS amount_cents, 1 AS purchase_count
           FROM sales s
           WHERE s.customer_id IS NOT NULL AND s.sold_at >= @start AND s.sold_at < @end
           UNION ALL
           SELECT s.customer_id, -CAST(ROUND(r.amount * 100) AS INTEGER) AS amount_cents, 0 AS purchase_count
           FROM sale_refunds r
           JOIN sales s ON s.id = r.sale_id
           WHERE s.customer_id IS NOT NULL AND r.returned_at >= @start AND r.returned_at < @end
         )
         SELECT c.id AS customerId, c.name AS customerName,
           SUM(customer_events.purchase_count) AS purchaseCount,
           SUM(customer_events.amount_cents) / 100.0 AS totalSpent
         FROM customer_events
         JOIN customers c ON c.id = customer_events.customer_id
         GROUP BY c.id, c.name
         HAVING SUM(customer_events.amount_cents) > 0
         ORDER BY totalSpent DESC, purchaseCount DESC LIMIT 5`
      )
      .all(range)
      .map((row) => {
        const customer = row as TopCustomer
        return { ...customer, totalSpent: money(customer.totalSpent) }
      })
  }
}
