import type Database from 'better-sqlite3'
import type { TaxInput, TaxRate } from '@shared/contracts'
import type { TaxRepository } from '../../../ports/tax.repository'

interface TaxRow {
  id: string
  name: string
  rate: number
  code: string
  is_default: number
  active: number
  deleted: number
  created_at: string
  updated_at: string
  product_count?: number
}

const SELECT_TAXES = `
  SELECT t.*,
    (SELECT COUNT(*) FROM products p WHERE p.tax_id = t.id AND p.deleted = 0) AS product_count
  FROM taxes t
`

function mapRow(row: TaxRow): TaxRate {
  return {
    id: row.id,
    name: row.name,
    rate: row.rate,
    code: row.code || undefined,
    isDefault: row.is_default === 1,
    active: row.active === 1,
    deleted: row.deleted === 1,
    productCount: row.product_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `TaxRepository` (migración 015). */
export class SqliteTaxRepository implements TaxRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(includeInactive = true): TaxRate[] {
    const where = includeInactive ? 'WHERE t.deleted = 0' : 'WHERE t.deleted = 0 AND t.active = 1'
    const rows = this.db
      .prepare(
        `${SELECT_TAXES} ${where}
         ORDER BY t.is_default DESC, t.rate DESC, t.name COLLATE NOCASE ASC`
      )
      .all() as TaxRow[]
    return rows.map(mapRow)
  }

  findById(id: string): TaxRate | null {
    const row = this.db.prepare(`${SELECT_TAXES} WHERE t.id = ?`).get(id) as TaxRow | undefined
    return row ? mapRow(row) : null
  }

  findByName(name: string): TaxRate | null {
    const row = this.db
      .prepare(`${SELECT_TAXES} WHERE t.name = ? COLLATE NOCASE AND t.deleted = 0`)
      .get(name.trim()) as TaxRow | undefined
    return row ? mapRow(row) : null
  }

  findDefault(): TaxRate | null {
    const row = this.db
      .prepare(
        `${SELECT_TAXES} WHERE t.deleted = 0 AND t.active = 1
         ORDER BY t.is_default DESC, t.rate DESC LIMIT 1`
      )
      .get() as TaxRow | undefined
    return row ? mapRow(row) : null
  }

  create(input: TaxInput & { id: string; createdAt: string; updatedAt: string }): TaxRate {
    const hasAny = (
      this.db.prepare('SELECT COUNT(*) AS total FROM taxes').get() as { total: number }
    ).total
    const isDefault = input.isDefault || hasAny === 0

    const run = this.db.transaction(() => {
      if (isDefault) {
        this.db.prepare('UPDATE taxes SET is_default = 0, updated_at = ?').run(input.updatedAt)
      }
      this.db
        .prepare(
          `INSERT INTO taxes (id, name, rate, code, is_default, active, deleted, created_at, updated_at)
           VALUES (@id, @name, @rate, @code, @isDefault, @active, 0, @createdAt, @updatedAt)`
        )
        .run({
          id: input.id,
          name: input.name,
          rate: input.rate,
          code: input.code ?? '',
          isDefault: isDefault ? 1 : 0,
          active: input.active ? 1 : 0,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt
        })
    })
    run()

    return this.findById(input.id) as TaxRate
  }

  update(tax: TaxRate): TaxRate {
    const updatedAt = tax.updatedAt ?? new Date().toISOString()

    const run = this.db.transaction(() => {
      if (tax.isDefault) {
        this.db.prepare('UPDATE taxes SET is_default = 0, updated_at = ?').run(updatedAt)
      }
      this.db
        .prepare(
          `UPDATE taxes SET
            name = @name, rate = @rate, code = @code, is_default = @isDefault,
            active = @active, updated_at = @updatedAt
           WHERE id = @id`
        )
        .run({
          id: tax.id,
          name: tax.name,
          rate: tax.rate,
          code: tax.code ?? '',
          isDefault: tax.isDefault ? 1 : 0,
          active: tax.active ? 1 : 0,
          updatedAt
        })
    })
    run()

    return this.findById(tax.id) as TaxRate
  }

  softDelete(id: string): void {
    this.db
      .prepare(
        'UPDATE taxes SET deleted = 1, active = 0, is_default = 0, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
  }

  setDefault(id: string): TaxRate {
    const now = new Date().toISOString()
    const run = this.db.transaction(() => {
      this.db
        .prepare('UPDATE taxes SET is_default = 0, updated_at = ? WHERE is_default = 1')
        .run(now)
      this.db
        .prepare('UPDATE taxes SET is_default = 1, active = 1, updated_at = ? WHERE id = ?')
        .run(now, id)
    })
    run()
    return this.findById(id) as TaxRate
  }

  countProducts(taxId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS total FROM products WHERE tax_id = ? AND deleted = 0')
      .get(taxId) as { total: number }
    return row.total
  }
}
