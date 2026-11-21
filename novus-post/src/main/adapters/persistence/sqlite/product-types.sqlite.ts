import type Database from 'better-sqlite3'
import type { ProductType, ProductTypeInput, ProductTypeFilter } from '@shared/contracts'
import type { ProductTypeRepository } from '../../../ports/product-type.repository'

interface ProductTypeRow {
  id: string
  name: string
  kind: string
  track_stock: number
  active: number
  deleted: number
  created_at: string
  updated_at: string
  product_count?: number
}

const SELECT_PRODUCT_TYPES = `
  SELECT t.*,
    (SELECT COUNT(*) FROM products p WHERE p.type_id = t.id) AS product_count
  FROM product_types t
`

function mapRow(row: ProductTypeRow): ProductType {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as ProductType['kind'],
    trackStock: Boolean(row.track_stock),
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    productCount: row.product_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `ProductTypeRepository`. */
export class SqliteProductTypeRepository implements ProductTypeRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: ProductTypeFilter): ProductType[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('t.deleted = 0')
    if (filter?.onlyActive) clauses.push('t.active = 1')
    if (filter?.search) {
      clauses.push('(t.name LIKE @search OR t.kind LIKE @search)')
      params.search = `%${filter.search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`${SELECT_PRODUCT_TYPES} ${where} ORDER BY t.name COLLATE NOCASE ASC`)
      .all(params) as ProductTypeRow[]

    return rows.map(mapRow)
  }

  findById(id: string): ProductType | null {
    const row = this.db.prepare(`${SELECT_PRODUCT_TYPES} WHERE t.id = ?`).get(id) as
      ProductTypeRow | undefined
    return row ? mapRow(row) : null
  }

  findByName(name: string): ProductType | null {
    const row = this.db
      .prepare(`${SELECT_PRODUCT_TYPES} WHERE t.name = ? COLLATE NOCASE`)
      .get(name.trim()) as ProductTypeRow | undefined
    return row ? mapRow(row) : null
  }

  create(
    input: ProductTypeInput & { id: string; createdAt: string; updatedAt: string }
  ): ProductType {
    this.db
      .prepare(
        `INSERT INTO product_types (
          id, name, kind, track_stock, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @name, @kind, @trackStock, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        name: input.name,
        kind: input.kind,
        trackStock: input.trackStock ? 1 : 0,
        active: input.active ? 1 : 0,
        deleted: input.deleted ? 1 : 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as ProductType
  }

  update(type: ProductType): ProductType {
    this.db
      .prepare(
        `UPDATE product_types SET
          name = @name,
          kind = @kind,
          track_stock = @trackStock,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: type.id,
        name: type.name,
        kind: type.kind,
        trackStock: type.trackStock ? 1 : 0,
        active: type.active ? 1 : 0,
        deleted: type.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(type.id) as ProductType
  }

  softDelete(id: string): void {
    this.db
      .prepare('UPDATE product_types SET deleted = 1, active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): ProductType {
    this.db
      .prepare(
        'UPDATE product_types SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as ProductType
  }

  countProducts(typeId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS total FROM products WHERE type_id = ?')
      .get(typeId) as { total: number }
    return row.total
  }
}
