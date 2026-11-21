import type Database from 'better-sqlite3'
import type {
  PermissionKey,
  User,
  UserRole,
  CreateUserInput,
  UpdateUserInput
} from '@shared/contracts'
import { ROLE_DEFAULT_PERMISSIONS, sanitizePermissionKeys } from '@shared/contracts'
import type { UserRepository, UserWithSecret } from '../../../ports/user.repository'

interface UserRow {
  id: string
  username: string
  email: string
  password_hash: string
  pin: string | null
  name: string
  role: string
  permissions: string | null
  active: number
  branch: string | null
  station: string | null
  created_at: string
  updated_at: string
}

function parsePermissions(raw: string | null | undefined, role: string): PermissionKey[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      // Un arreglo explícito (incluso vacío) es intencional: respeta lo configurado por el administrador.
      if (Array.isArray(parsed)) return sanitizePermissionKeys(parsed)
    } catch {
      // Ignorar fallback
    }
  }

  // Permisos por defecto según rol si la columna estaba vacía o corrupta
  const preset = ROLE_DEFAULT_PERMISSIONS[role as UserRole] ?? ROLE_DEFAULT_PERMISSIONS.CASHIER
  return [...preset]
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    pin: row.pin ?? undefined,
    permissions: parsePermissions(row.permissions, row.role),
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

  findByUsername(username: string): UserWithSecret | null {
    const stmt = this.db.prepare<[string], UserRow>(`
      SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1
    `)
    const row = stmt.get(username.trim().toLowerCase())
    return row ? { ...mapRow(row), passwordHash: row.password_hash } : null
  }

  findByEmail(email: string): UserWithSecret | null {
    const stmt = this.db.prepare<[string], UserRow>(`
      SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1
    `)
    const row = stmt.get(email.trim().toLowerCase())
    return row ? { ...mapRow(row), passwordHash: row.password_hash } : null
  }

  findById(id: string): User | null {
    const stmt = this.db.prepare<[string], UserRow>(`
      SELECT * FROM users WHERE id = ?
    `)
    const row = stmt.get(id)
    return row ? mapRow(row) : null
  }

  findAll(includeInactive = true): User[] {
    const query = includeInactive
      ? `SELECT * FROM users ORDER BY role ASC, name ASC`
      : `SELECT * FROM users WHERE active = 1 ORDER BY role ASC, name ASC`
    const stmt = this.db.prepare<[], UserRow>(query)
    return stmt.all().map(mapRow)
  }

  create(input: CreateUserInput): User {
    const now = new Date().toISOString()
    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const requestedPermissions = sanitizePermissionKeys(input.permissions)
    const permissionsJson = JSON.stringify(
      requestedPermissions.length > 0 ? requestedPermissions : parsePermissions(null, input.role)
    )

    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, pin, name, role, permissions, active, branch, station, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?
      )
    `)

    stmt.run(
      id,
      input.username.trim().toLowerCase(),
      input.email.trim().toLowerCase(),
      input.password,
      input.pin?.trim() || null,
      input.name.trim(),
      input.role,
      permissionsJson,
      input.branch || 'Sucursal Central',
      input.station || 'CAJA-01',
      now,
      now
    )

    return this.findById(id)!
  }

  update(input: UpdateUserInput): User {
    const now = new Date().toISOString()
    const current = this.findById(input.id)
    if (!current) throw new Error(`Usuario con id "${input.id}" no encontrado.`)

    const updates: string[] = ['updated_at = ?']
    const params: unknown[] = [now]

    if (input.name !== undefined) {
      updates.push('name = ?')
      params.push(input.name.trim())
    }
    if (input.username !== undefined) {
      updates.push('username = ?')
      params.push(input.username.trim().toLowerCase())
    }
    if (input.email !== undefined) {
      updates.push('email = ?')
      params.push(input.email.trim().toLowerCase())
    }
    if (input.password !== undefined && input.password.trim().length > 0) {
      updates.push('password_hash = ?')
      params.push(input.password)
    }
    if (input.pin !== undefined) {
      updates.push('pin = ?')
      params.push(input.pin.trim() || null)
    }
    if (input.role !== undefined) {
      updates.push('role = ?')
      params.push(input.role)
    }
    if (input.permissions !== undefined) {
      updates.push('permissions = ?')
      params.push(JSON.stringify(sanitizePermissionKeys(input.permissions)))
    }
    if (input.active !== undefined) {
      updates.push('active = ?')
      params.push(input.active ? 1 : 0)
    }
    if (input.branch !== undefined) {
      updates.push('branch = ?')
      params.push(input.branch)
    }
    if (input.station !== undefined) {
      updates.push('station = ?')
      params.push(input.station)
    }

    params.push(input.id)
    this.db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    return this.findById(input.id)!
  }

  delete(id: string): void {
    const now = new Date().toISOString()
    this.db.prepare(`UPDATE users SET active = 0, updated_at = ? WHERE id = ?`).run(now, id)
  }

  toggleStatus(id: string): User {
    const current = this.findById(id)
    if (!current) throw new Error(`Usuario con id "${id}" no encontrado.`)
    const newActive = current.active ? 0 : 1
    const now = new Date().toISOString()
    this.db
      .prepare(`UPDATE users SET active = ?, updated_at = ? WHERE id = ?`)
      .run(newActive, now, id)
    return this.findById(id)!
  }

  updatePassword(id: string, newPassword: string): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(newPassword, now, id)
  }
}
