import type Database from 'better-sqlite3'
import type { Category, CategoryInput, CategoryFilter } from '@shared/contracts'
import type { CategoryRepository } from '../../../ports/category.repository'

interface CategoryRow {
  id: string
  name: string
  description: string | null
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

function mapRow(row: CategoryRow): Category {
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

/** Adaptador SQLite del puerto `CategoryRepository`. */
export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: CategoryFilter): Category[] {
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
      .prepare(`SELECT * FROM categories ${where} ORDER BY name COLLATE NOCASE ASC`)
      .all(params) as CategoryRow[]

    return rows.map(mapRow)
  }

  findById(id: string): Category | null {
    const row = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as
      | CategoryRow
      | undefined
    return row ? mapRow(row) : null
  }

  findByName(name: string): Category | null {
    const row = this.db
      .prepare('SELECT * FROM categories WHERE name = ? COLLATE NOCASE')
      .get(name.trim()) as CategoryRow | undefined
    return row ? mapRow(row) : null
  }

  create(input: CategoryInput & { id: string; createdAt: string; updatedAt: string }): Category {
    this.db
      .prepare(
        `INSERT INTO categories (
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

    return this.findById(input.id) as Category
  }

  update(category: Category): Category {
    this.db
      .prepare(
        `UPDATE categories SET
          name = @name,
          description = @description,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: category.id,
        name: category.name,
        description: category.description || null,
        active: category.active ? 1 : 0,
        deleted: category.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(category.id) as Category
  }

  softDelete(id: string): void {
    this.db
      .prepare('UPDATE categories SET deleted = 1, active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): Category {
    this.db
      .prepare(
        'UPDATE categories SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as Category
  }
}
