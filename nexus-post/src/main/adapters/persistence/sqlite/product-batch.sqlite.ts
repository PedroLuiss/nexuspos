import type Database from 'better-sqlite3'
import type {
  ProductBatch,
  ProductBatchInput,
  ProductBatchFilter
} from '@shared/contracts'
import type { ProductBatchRepository } from '../../../ports/product-batch.repository'

interface BatchRow {
  id: string
  product_id: string
  batch_number: string
  quantity: number
  expiration_date: string | null
  entered_at: string
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

function mapRow(row: BatchRow): ProductBatch {
  return {
    id: row.id,
    productId: row.product_id,
    batchNumber: row.batch_number,
    quantity: row.quantity,
    expirationDate: row.expiration_date ?? undefined,
    enteredAt: row.entered_at,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `ProductBatchRepository`. */
export class SqliteProductBatchRepository implements ProductBatchRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: ProductBatchFilter): ProductBatch[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('deleted = 0')
    if (filter?.onlyActive) clauses.push('active = 1')
    if (filter?.productId) {
      clauses.push('product_id = @productId')
      params.productId = filter.productId
    }
    if (filter?.onlyWithStock) clauses.push('quantity > 0')
    if (filter?.onlyExpired) clauses.push("expiration_date IS NOT NULL AND expiration_date < date('now')")

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(
        `SELECT * FROM product_batches ${where}
         ORDER BY (expiration_date IS NULL) ASC, expiration_date ASC, entered_at ASC`
      )
      .all(params) as BatchRow[]

    return rows.map(mapRow)
  }

  findById(id: string): ProductBatch | null {
    const row = this.db
      .prepare('SELECT * FROM product_batches WHERE id = ?')
      .get(id) as BatchRow | undefined
    return row ? mapRow(row) : null
  }

  findByProductId(productId: string, onlyWithStock = true): ProductBatch[] {
    const stockClause = onlyWithStock ? ' AND quantity > 0' : ''
    const rows = this.db
      .prepare(
        `SELECT * FROM product_batches
         WHERE product_id = ? AND deleted = 0 AND active = 1${stockClause}
         ORDER BY (expiration_date IS NULL) ASC, expiration_date ASC, entered_at ASC`
      )
      .all(productId) as BatchRow[]
    return rows.map(mapRow)
  }

  create(
    input: ProductBatchInput & { id: string; enteredAt: string; createdAt: string; updatedAt: string }
  ): ProductBatch {
    this.db
      .prepare(
        `INSERT INTO product_batches (
          id, product_id, batch_number, quantity, expiration_date,
          entered_at, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @productId, @batchNumber, @quantity, @expirationDate,
          @enteredAt, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        productId: input.productId,
        batchNumber: input.batchNumber,
        quantity: input.quantity,
        expirationDate: input.expirationDate ?? null,
        enteredAt: input.enteredAt,
        active: input.active ? 1 : 0,
        deleted: 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as ProductBatch
  }

  update(batch: ProductBatch): ProductBatch {
    this.db
      .prepare(
        `UPDATE product_batches SET
          batch_number = @batchNumber,
          quantity = @quantity,
          expiration_date = @expirationDate,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: batch.id,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        expirationDate: batch.expirationDate ?? null,
        active: batch.active ? 1 : 0,
        deleted: batch.deleted ? 1 : 0,
        updatedAt: batch.updatedAt ?? new Date().toISOString()
      })

    return this.findById(batch.id) as ProductBatch
  }

  softDelete(id: string): void {
    this.db
      .prepare('UPDATE product_batches SET deleted = 1, active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  }

  totalStock(productId: string): number {
    const row = this.db
      .prepare(
        'SELECT COALESCE(SUM(quantity), 0) AS total FROM product_batches WHERE product_id = ? AND deleted = 0 AND active = 1'
      )
      .get(productId) as { total: number }
    return row.total
  }
}
