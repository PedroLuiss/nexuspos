import type Database from 'better-sqlite3'
import type { KardexMovement, KardexMovementType, KardexReason } from '@shared/contracts'
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
    notes: row.notes ?? undefined
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
          previous_stock, quantity, new_stock, responsible_user, notes, created_at
        ) VALUES (
          @id, @productId, @productName, @productCode, @type, @reason,
          @previousStock, @quantity, @newStock, @responsibleUser, @notes, @timestamp
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
        timestamp: movement.timestamp
      })
  }

  findAll(productId?: string): KardexMovement[] {
    const where = productId ? 'WHERE product_id = ?' : ''
    const rows = (
      productId
        ? this.db
            .prepare(`SELECT * FROM stock_movements ${where} ORDER BY created_at DESC`)
            .all(productId)
        : this.db.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC').all()
    ) as MovementRow[]

    return rows.map(mapRow)
  }
}
