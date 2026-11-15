import type { CreateUserInput, UpdateUserInput, User } from '@shared/contracts'
import { ROLE_DEFAULT_PERMISSIONS, sanitizePermissionKeys } from '@shared/contracts'

export function toErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (!raw) return 'Ocurrió un error inesperado al procesar la solicitud.'
  // Limpia el prefijo que Electron añade al rechazar un handler IPC.
  return raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
}

/**
 * Fallback en memoria para ejecutar la UI fuera de Electron (preview web de Vite).
 * En la aplicación real todas las operaciones se persisten en SQLite vía IPC.
 */
let demoSequence = 100
let demoUsers: User[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    email: 'admin@nexuspos.pe',
    name: 'Admin Sistema',
    role: 'ADMIN',
    pin: '9999',
    active: true,
    branch: 'Sucursal Central',
    station: 'TERMINAL-00',
    permissions: [...ROLE_DEFAULT_PERMISSIONS.ADMIN]
  },
  {
    id: 'usr-cajero-01',
    username: 'cajero.central',
    email: 'cajero.central@nexuspos.pe',
    name: 'Carlos Morales',
    role: 'CASHIER',
    pin: '1234',
    active: true,
    branch: 'Sucursal Central',
    station: 'CAJA-01',
    permissions: [...ROLE_DEFAULT_PERMISSIONS.CASHIER]
  }
]

function buildDemoUser(input: CreateUserInput): User {
  demoSequence += 1
  const permissions = sanitizePermissionKeys(input.permissions)
  return {
    id: `usr-demo-${demoSequence}`,
    username: input.username.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    role: input.role,
    pin: input.pin,
    active: true,
    branch: input.branch ?? 'Sucursal Central',
    station: input.station ?? 'CAJA-01',
    permissions:
      permissions.length > 0 ? permissions : [...ROLE_DEFAULT_PERMISSIONS[input.role]]
  }
}

function requireDemoUser(id: string): User {
  const found = demoUsers.find((u) => u.id === id)
  if (!found) throw new Error(`Usuario con id "${id}" no encontrado.`)
  return found
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    if (window.api?.users) return window.api.users.list()
    return demoUsers
  },

  getById: async (id: string): Promise<User | null> => {
    if (window.api?.users) return window.api.users.getById(id)
    return demoUsers.find((u) => u.id === id) ?? null
  },

  create: async (input: CreateUserInput): Promise<User> => {
    if (window.api?.users) return window.api.users.create(input)
    const created = buildDemoUser(input)
    demoUsers = [...demoUsers, created]
    return created
  },

  update: async (input: UpdateUserInput): Promise<User> => {
    if (window.api?.users) return window.api.users.update(input)
    const current = requireDemoUser(input.id)
    const updated: User = {
      ...current,
      username: input.username?.trim().toLowerCase() ?? current.username,
      email: input.email?.trim().toLowerCase() ?? current.email,
      name: input.name?.trim() ?? current.name,
      role: input.role ?? current.role,
      pin: input.pin !== undefined ? input.pin || undefined : current.pin,
      active: input.active ?? current.active,
      permissions:
        input.permissions !== undefined
          ? sanitizePermissionKeys(input.permissions)
          : current.permissions
    }
    demoUsers = demoUsers.map((u) => (u.id === updated.id ? updated : u))
    return updated
  },

  delete: async (id: string): Promise<void> => {
    if (window.api?.users) return window.api.users.delete(id)
    requireDemoUser(id)
    demoUsers = demoUsers.map((u) => (u.id === id ? { ...u, active: false } : u))
  },

  toggleStatus: async (id: string): Promise<User> => {
    if (window.api?.users) return window.api.users.toggleStatus(id)
    const current = requireDemoUser(id)
    const updated: User = { ...current, active: !current.active }
    demoUsers = demoUsers.map((u) => (u.id === id ? updated : u))
    return updated
  }
}
