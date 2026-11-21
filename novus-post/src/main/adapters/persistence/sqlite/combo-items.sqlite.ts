import type Database from 'better-sqlite3'
import type { ComboItem, ComboItemInput, ComboItemFilter } from '@shared/contracts'
import type { ComboItemRepository } from '../../../ports/combo-item.repository'

interface ComboItemRow {
  id: string
  combo_id: string
  component_id: string
  quantity: number
  active: number
  deleted: number
  created_at: string
  updated_at: string
  component_name?: string
}

function mapRow(row: ComboItemRow): ComboItem {
  return {
    id: row.id,
    comboId: row.combo_id,
    componentId: row.component_id,
    componentName: row.component_name ?? undefined,
    quantity: row.quantity,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `ComboItemRepository`. */
export class SqliteComboItemRepository implements ComboItemRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: ComboItemFilter): ComboItem[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('ci.deleted = 0')
    if (filter?.onlyActive) clauses.push('ci.active = 1')
    if (filter?.comboId) {
      clauses.push('ci.combo_id = @comboId')
      params.comboId = filter.comboId
    }
    if (filter?.componentId) {
      clauses.push('ci.component_id = @componentId')
      params.componentId = filter.componentId
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(
        `SELECT ci.*, p.name AS component_name
         FROM combo_items ci
         LEFT JOIN products p ON p.id = ci.component_id
         ${where}
         ORDER BY p.name COLLATE NOCASE ASC`
      )
      .all(params) as ComboItemRow[]

    return rows.map(mapRow)
  }

  findById(id: string): ComboItem | null {
    const row = this.db
      .prepare(
        `SELECT ci.*, p.name AS component_name
         FROM combo_items ci
         LEFT JOIN products p ON p.id = ci.component_id
         WHERE ci.id = ?`
      )
      .get(id) as ComboItemRow | undefined
    return row ? mapRow(row) : null
  }

  findByComboId(comboId: string): ComboItem[] {
    const rows = this.db
      .prepare(
        `SELECT ci.*, p.name AS component_name
         FROM combo_items ci
         LEFT JOIN products p ON p.id = ci.component_id
         WHERE ci.combo_id = ? AND ci.deleted = 0
         ORDER BY p.name COLLATE NOCASE ASC`
      )
      .all(comboId) as ComboItemRow[]
    return rows.map(mapRow)
  }

  create(input: ComboItemInput & { id: string; createdAt: string; updatedAt: string }): ComboItem {
    this.db
      .prepare(
        `INSERT INTO combo_items (
          id, combo_id, component_id, quantity, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @comboId, @componentId, @quantity, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        comboId: input.comboId,
        componentId: input.componentId,
        quantity: input.quantity,
        active: input.active ? 1 : 0,
        deleted: 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as ComboItem
  }

  update(item: ComboItem): ComboItem {
    this.db
      .prepare(
        `UPDATE combo_items SET
          combo_id = @comboId,
          component_id = @componentId,
          quantity = @quantity,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: item.id,
        comboId: item.comboId,
        componentId: item.componentId,
        quantity: item.quantity,
        active: item.active ? 1 : 0,
        deleted: item.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(item.id) as ComboItem
  }

  softDelete(id: string): void {
    this.db
      .prepare('UPDATE combo_items SET deleted = 1, active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): ComboItem {
    this.db
      .prepare(
        'UPDATE combo_items SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as ComboItem
  }
}
