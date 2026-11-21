import type Database from 'better-sqlite3'
import type { Brand, BrandInput, BrandFilter } from '@shared/contracts'
import type { BrandRepository } from '../../../ports/brand.repository'

interface BrandRow {
  id: string
  name: string
  description: string | null
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

function mapRow(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `BrandRepository`. */
export class SqliteBrandRepository implements BrandRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: BrandFilter): Brand[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('deleted = 0')
    if (filter?.onlyActive) clauses.push('active = 1')
    if (filter?.search) {
      clauses.push('(name LIKE @search OR description LIKE @search)')
      params.search = `%${filter.search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`SELECT * FROM brands ${where} ORDER BY name COLLATE NOCASE ASC`)
      .all(params) as BrandRow[]

    return rows.map(mapRow)
  }

  findById(id: string): Brand | null {
    const row = this.db
      .prepare('SELECT * FROM brands WHERE id = ?')
      .get(id) as BrandRow | undefined
    return row ? mapRow(row) : null
  }

  findByName(name: string): Brand | null {
    const row = this.db
      .prepare('SELECT * FROM brands WHERE name = ? COLLATE NOCASE')
      .get(name.trim()) as BrandRow | undefined
    return row ? mapRow(row) : null
  }

  create(
    input: BrandInput & { id: string; createdAt: string; updatedAt: string }
  ): Brand {
    this.db
      .prepare(
        `INSERT INTO brands (
          id, name, description, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @name, @description, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        name: input.name,
        description: input.description || null,
        active: input.active ? 1 : 0,
        deleted: input.deleted ? 1 : 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as Brand
  }

  update(brand: Brand): Brand {
    this.db
      .prepare(
        `UPDATE brands SET
          name = @name,
          description = @description,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: brand.id,
        name: brand.name,
        description: brand.description || null,
        active: brand.active ? 1 : 0,
        deleted: brand.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(brand.id) as Brand
  }

  softDelete(id: string): void {
    this.db
      .prepare(
        'UPDATE brands SET deleted = 1, active = 0, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): Brand {
    this.db
      .prepare(
        'UPDATE brands SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as Brand
  }
}
