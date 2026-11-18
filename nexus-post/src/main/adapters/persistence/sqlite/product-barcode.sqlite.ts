import type Database from 'better-sqlite3'
import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter
} from '@shared/contracts'
import type { ProductBarcodeRepository } from '../../../ports/product-barcode.repository'

interface ProductBarcodeRow {
  id: string
  product_id: string
  barcode: string
  format: string
  label: string | null
  is_primary: number
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

function mapRow(row: ProductBarcodeRow): ProductBarcode {
  return {
    id: row.id,
    productId: row.product_id,
    barcode: row.barcode,
    format: row.format as ProductBarcode['format'],
    label: row.label ?? undefined,
    isPrimary: row.is_primary === 1,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `ProductBarcodeRepository`. */
export class SqliteProductBarcodeRepository implements ProductBarcodeRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: ProductBarcodeFilter): ProductBarcode[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('deleted = 0')
    if (filter?.onlyActive) clauses.push('active = 1')
    if (filter?.productId) {
      clauses.push('product_id = @productId')
      params.productId = filter.productId
    }
    if (filter?.search) {
      clauses.push('(barcode LIKE @search OR label LIKE @search)')
      params.search = `%${filter.search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`SELECT * FROM product_barcodes ${where} ORDER BY barcode COLLATE NOCASE ASC`)
      .all(params) as ProductBarcodeRow[]

    return rows.map(mapRow)
  }

  findById(id: string): ProductBarcode | null {
    const row = this.db
      .prepare('SELECT * FROM product_barcodes WHERE id = ?')
      .get(id) as ProductBarcodeRow | undefined
    return row ? mapRow(row) : null
  }

  findByBarcode(barcode: string): ProductBarcode | null {
    const row = this.db
      .prepare('SELECT * FROM product_barcodes WHERE barcode = ?')
      .get(barcode.trim()) as ProductBarcodeRow | undefined
    return row ? mapRow(row) : null
  }

  findByProductId(productId: string): ProductBarcode[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM product_barcodes WHERE product_id = ? ORDER BY is_primary DESC, barcode COLLATE NOCASE ASC'
      )
      .all(productId) as ProductBarcodeRow[]
    return rows.map(mapRow)
  }

  create(
    input: ProductBarcodeInput & { id: string; createdAt: string; updatedAt: string }
  ): ProductBarcode {
    this.db
      .prepare(
        `INSERT INTO product_barcodes (
          id, product_id, barcode, format, label, is_primary, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @productId, @barcode, @format, @label, @isPrimary, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        productId: input.productId,
        barcode: input.barcode,
        format: input.format,
        label: input.label || null,
        isPrimary: input.isPrimary ? 1 : 0,
        active: input.active ? 1 : 0,
        deleted: 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as ProductBarcode
  }

  update(barcode: ProductBarcode): ProductBarcode {
    this.db
      .prepare(
        `UPDATE product_barcodes SET
          product_id = @productId,
          barcode = @barcode,
          format = @format,
          label = @label,
          is_primary = @isPrimary,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: barcode.id,
        productId: barcode.productId,
        barcode: barcode.barcode,
        format: barcode.format,
        label: barcode.label || null,
        isPrimary: barcode.isPrimary ? 1 : 0,
        active: barcode.active ? 1 : 0,
        deleted: barcode.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(barcode.id) as ProductBarcode
  }

  softDelete(id: string): void {
    this.db
      .prepare(
        'UPDATE product_barcodes SET deleted = 1, active = 0, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): ProductBarcode {
    this.db
      .prepare(
        'UPDATE product_barcodes SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as ProductBarcode
  }
}
