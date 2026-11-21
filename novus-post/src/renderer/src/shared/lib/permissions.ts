import type { ModulePermission, PermissionKey, User } from '@shared/contracts'
import { ADMIN_PERMISSION_KEYS, ROLE_DEFAULT_PERMISSIONS, isValidPermissionKey } from '@shared/contracts'

/** Relación entre los tabs de navegación y los permisos modulares persistidos. */
export const TAB_PERMISSION_MAP: Record<string, ModulePermission> = {
  pos: 'pos',
  products: 'inventory',
  kardex: 'kardex',
  cash: 'cash',
  customers: 'customers',
  reports: 'reports',
  settings: 'settings'
}

/**
 * Permisos efectivos de un usuario.
 * - ADMIN: acceso total (superusuario) independientemente de la matriz guardada.
 * - Otros roles: permisos persistidos en SQLite o preset por rol como respaldo.
 */
export function getUserPermissions(user: User | null): PermissionKey[] {
  if (!user) return []

  if (user.role === 'ADMIN') return [...ADMIN_PERMISSION_KEYS]

  // Un arreglo persistido (incluso vacío) es la configuración explícita del administrador.
  if (Array.isArray(user.permissions)) {
    return user.permissions.filter(isValidPermissionKey)
  }

  return [...ROLE_DEFAULT_PERMISSIONS[user.role]]
}

export function hasPermission(user: User | null, key: PermissionKey): boolean {
  if (!user) return false
  return getUserPermissions(user).includes(key)
}

/**
 * Valida el acceso a una pestaña/módulo.
 * La terminal de ventas (POS) es el núcleo operativo y siempre está disponible.
 */
export function canAccessTab(user: User | null, tabId: string): boolean {
  if (!user) return false
  if (tabId === 'pos') return true
  const required = TAB_PERMISSION_MAP[tabId]
  return required ? hasPermission(user, required) : true
}

/** Solo el rol Administrador puede gestionar usuarios, roles y permisos. */
export function canManageUsers(user: User | null): boolean {
  return user?.role === 'ADMIN'
}
