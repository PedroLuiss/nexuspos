import type Database from 'better-sqlite3'
import type { Supplier, SupplierInput, SupplierFilter } from '@shared/contracts'
import type { SupplierRepository } from '../../../ports/supplier.repository'

interface SupplierRow {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

function mapRow(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `SupplierRepository`. */
export class SqliteSupplierRepository implements SupplierRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: SupplierFilter): Supplier[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('deleted = 0')
    if (filter?.onlyActive) clauses.push('active = 1')
    if (filter?.search) {
      clauses.push('(name LIKE @search OR contact_name LIKE @search)')
      params.search = `%${filter.search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`SELECT * FROM suppliers ${where} ORDER BY name COLLATE NOCASE ASC`)
      .all(params) as SupplierRow[]

    return rows.map(mapRow)
  }

  findById(id: string): Supplier | null {
    const row = this.db
      .prepare('SELECT * FROM suppliers WHERE id = ?')
      .get(id) as SupplierRow | undefined
    return row ? mapRow(row) : null
  }

  findByName(name: string): Supplier | null {
    const row = this.db
      .prepare('SELECT * FROM suppliers WHERE name = ? COLLATE NOCASE')
      .get(name.trim()) as SupplierRow | undefined
    return row ? mapRow(row) : null
  }

  create(
    input: SupplierInput & { id: string; createdAt: string; updatedAt: string }
  ): Supplier {
    this.db
      .prepare(
        `INSERT INTO suppliers (
          id, name, contact_name, phone, email, address, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @name, @contactName, @phone, @email, @address, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        name: input.name,
        contactName: input.contactName || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        active: input.active ? 1 : 0,
        deleted: input.deleted ? 1 : 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as Supplier
  }

  update(supplier: Supplier): Supplier {
    this.db
      .prepare(
        `UPDATE suppliers SET
          name = @name,
          contact_name = @contactName,
          phone = @phone,
          email = @email,
          address = @address,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName || null,
        phone: supplier.phone || null,
        email: supplier.email || null,
        address: supplier.address || null,
        active: supplier.active ? 1 : 0,
        deleted: supplier.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(supplier.id) as Supplier
  }

  softDelete(id: string): void {
    this.db
      .prepare(
        'UPDATE suppliers SET deleted = 1, active = 0, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): Supplier {
    this.db
      .prepare(
        'UPDATE suppliers SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as Supplier
  }
}
