import type Database from 'better-sqlite3'
import type {
  KardexMovement,
  KardexMovementPage,
  KardexMovementQuery,
  KardexMovementSource,
  KardexMovementType,
  KardexReason,
  KardexValuationBasis
} from '@shared/contracts'
import type { StockMovementRepository } from '../../../ports/stock-movement.repository'

interface MovementRow {
  id: string
  created_at: string
  product_id: string
  product_name: string
  product_code: string
  type: string
  reason: string
  previous_stock: number
  quantity: number
  new_stock: number
  responsible_user: string
  notes: string | null
  source: string
  unit: string | null
  reference: string | null
  batch_number: string | null
  unit_cost: number | null
  valuation_basis: string | null
}

function mapRow(row: MovementRow): KardexMovement {
  return {
    id: row.id,
    timestamp: row.created_at,
    productId: row.product_id,
    productName: row.product_name,
    productCode: row.product_code,
    type: row.type as KardexMovementType,
    reason: row.reason as KardexReason,
    previousStock: row.previous_stock,
    quantity: row.quantity,
    newStock: row.new_stock,
    responsibleUser: row.responsible_user,
    notes: row.notes ?? undefined,
    source: row.source as KardexMovementSource,
    unit: row.unit ?? undefined,
    reference: row.reference ?? undefined,
    batchNumber: row.batch_number ?? undefined,
    unitCost: row.unit_cost ?? undefined,
    valuationBasis: (row.valuation_basis ?? undefined) as KardexValuationBasis | undefined
  }
}

function buildFilter(query: KardexMovementQuery): {
  where: string
  parameters: Record<string, string | number>
} {
  const conditions: string[] = []
  const parameters: Record<string, string | number> = {}

  if (query.period !== 'ALL' && query.from && query.to) {
    conditions.push('created_at >= @from AND created_at < @to')
    parameters.from = query.from
    parameters.to = query.to
  }
  if (query.type !== 'ALL') {
    conditions.push('type = @type')
    parameters.type = query.type
  }
  if (query.reason !== 'ALL') {
    conditions.push('reason = @reason')
    parameters.reason = query.reason
  }
  if (query.search.trim()) {
    conditions.push(`(
      product_name LIKE @search OR product_code LIKE @search OR
      responsible_user LIKE @search OR COALESCE(reference, '') LIKE @search OR
      COALESCE(batch_number, '') LIKE @search OR COALESCE(notes, '') LIKE @search
    )`)
    parameters.search = `%${query.search.trim()}%`
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    parameters
  }
}

/** Adaptador SQLite del puerto `StockMovementRepository`. */
export class SqliteStockMovementRepository implements StockMovementRepository {
  constructor(private readonly db: Database.Database) {}

  insert(movement: KardexMovement): void {
    this.db
      .prepare(
        `INSERT INTO stock_movements (
          id, product_id, product_name, product_code, type, reason,
          previous_stock, quantity, new_stock, responsible_user, notes, created_at,
          source, unit, reference, batch_number, unit_cost, valuation_basis
        ) VALUES (
          @id, @productId, @productName, @productCode, @type, @reason,
          @previousStock, @quantity, @newStock, @responsibleUser, @notes, @timestamp,
          @source, @unit, @reference, @batchNumber, @unitCost, @valuationBasis
        )`
      )
      .run({
        id: movement.id,
        productId: movement.productId,
        productName: movement.productName,
        productCode: movement.productCode,
        type: movement.type,
        reason: movement.reason,
        previousStock: movement.previousStock,
        quantity: movement.quantity,
        newStock: movement.newStock,
        responsibleUser: movement.responsibleUser,
        notes: movement.notes ?? null,
        timestamp: movement.timestamp,
        source: movement.source,
        unit: movement.unit ?? null,
        reference: movement.reference ?? null,
        batchNumber: movement.batchNumber ?? null,
        unitCost: movement.unitCost ?? null,
        valuationBasis: movement.valuationBasis ?? null
      })
  }

  findAll(query: KardexMovementQuery): KardexMovement[] {
    const { where, parameters } = buildFilter(query)
    const rows = this.db
      .prepare(`SELECT * FROM stock_movements ${where} ORDER BY created_at DESC, id DESC`)
      .all(parameters) as MovementRow[]
    return rows.map(mapRow)
  }

  findPage(query: KardexMovementQuery): KardexMovementPage {
    const { where, parameters } = buildFilter(query)
    const totals = this.db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          COUNT(DISTINCT product_id) AS distinct_products,
          SUM(CASE WHEN type = 'ENTRADA' THEN 1 ELSE 0 END) AS entry_movements,
          SUM(CASE WHEN type = 'SALIDA' THEN 1 ELSE 0 END) AS exit_movements
        FROM stock_movements ${where}`
      )
      .get(parameters) as {
      total: number
      distinct_products: number
      entry_movements: number | null
      exit_movements: number | null
    }

    const quantities = this.db
      .prepare(
        `SELECT type, COALESCE(NULLIF(unit, ''), 'Unidad sin registrar') AS unit,
          SUM(quantity) AS quantity
        FROM stock_movements ${where}
        GROUP BY type, COALESCE(NULLIF(unit, ''), 'Unidad sin registrar')
        ORDER BY unit`
      )
      .all(parameters) as { type: string; unit: string; quantity: number }[]

    const total = totals.total
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const page = Math.min(query.page, totalPages)
    const rows = this.db
      .prepare(
        `SELECT * FROM stock_movements ${where}
        ORDER BY created_at DESC, id DESC
        LIMIT @limit OFFSET @offset`
      )
      .all({
        ...parameters,
        limit: query.pageSize,
        offset: (page - 1) * query.pageSize
      }) as MovementRow[]

    return {
      items: rows.map(mapRow),
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
      summary: {
        total,
        distinctProducts: totals.distinct_products,
        entryMovements: totals.entry_movements ?? 0,
        exitMovements: totals.exit_movements ?? 0,
        entriesByUnit: quantities
          .filter((row) => row.type === 'ENTRADA')
          .map(({ unit, quantity }) => ({ unit, quantity })),
        exitsByUnit: quantities
          .filter((row) => row.type === 'SALIDA')
          .map(({ unit, quantity }) => ({ unit, quantity }))
      }
    }
  }

  findSaleUnitCost(reference: string, productId: string): number | null {
    const row = this.db
      .prepare(
        `SELECT unit_cost FROM stock_movements
        WHERE reference = ? AND product_id = ? AND source = 'POS'
          AND type = 'SALIDA' AND unit_cost IS NOT NULL
        ORDER BY created_at DESC, id DESC LIMIT 1`
      )
      .get(reference, productId) as { unit_cost: number } | undefined

    return row?.unit_cost ?? null
  }
}
