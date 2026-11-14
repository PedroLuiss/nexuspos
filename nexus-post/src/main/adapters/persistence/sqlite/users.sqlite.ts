import type Database from 'better-sqlite3'
import type { User, UserRole } from '@shared/contracts'
import type { UserRepository, UserWithSecret } from '../../../ports/user.repository'

interface UserRow {
  id: string
  username: string
  email: string
  password_hash: string
  pin: string | null
  name: string
  role: string
  active: number
  branch: string | null
  station: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    pin: row.pin ?? undefined,
    active: Boolean(row.active),
    branch: row.branch ?? undefined,
    station: row.station ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database.Database) {}

  findByEmailOrUsername(identifier: string): UserWithSecret | null {
    const clean = identifier.trim().toLowerCase()
    const stmt = this.db.prepare<[string, string], UserRow>(`
      SELECT * FROM users
      WHERE (LOWER(email) = ? OR LOWER(username) = ?)
        AND active = 1
      LIMIT 1
    `)
    const row = stmt.get(clean, clean)
    if (!row) return null

    return {
      ...mapRow(row),
      passwordHash: row.password_hash
    }
  }

  findByPin(pin: string): User | null {
    const cleanPin = pin.trim()
    const stmt = this.db.prepare<[string], UserRow>(`
      SELECT * FROM users
      WHERE pin = ? AND active = 1
      LIMIT 1
    `)
    const row = stmt.get(cleanPin)
    return row ? mapRow(row) : null
  }

  findById(id: string): User | null {
    const stmt = this.db.prepare<[string], UserRow>(`
      SELECT * FROM users WHERE id = ?
    `)
    const row = stmt.get(id)
    return row ? mapRow(row) : null
  }

  findAll(): User[] {
    const stmt = this.db.prepare<[], UserRow>(`
      SELECT * FROM users WHERE active = 1 ORDER BY name ASC
    `)
    return stmt.all().map(mapRow)
  }
}
