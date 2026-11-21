import type { User, UserRole } from './auth.contract'

export type ModulePermission =
  'pos' | 'inventory' | 'kardex' | 'cash' | 'customers' | 'reports' | 'settings'

export type ActionPermission =
  | 'CAN_CREATE_PRODUCT'
  | 'CAN_EDIT_PRODUCT'
  | 'CAN_DELETE_PRODUCT'
  | 'CAN_MODIFY_PRICE'
  | 'CAN_ADJUST_STOCK'
  | 'CAN_APPLY_DISCOUNT'
  | 'CAN_MANUAL_CASH_MOVEMENTS'
  | 'CAN_OVERRIDE_NO_STOCK'
  | 'MANAGE_USERS'

export type PermissionKey = ModulePermission | ActionPermission

export interface PermissionDescriptor<K extends PermissionKey = PermissionKey> {
  key: K
  label: string
  description: string
}

export const ALL_MODULE_PERMISSIONS: PermissionDescriptor<ModulePermission>[] = [
  { key: 'pos', label: 'Ventas y Caja (POS)', description: 'Terminal de cobro [F1] y tickets' },
  {
    key: 'inventory',
    label: 'Inventario y Catálogo',
    description: 'Productos, precios y ajustes [F2]'
  },
  { key: 'kardex', label: 'Kardex y Auditoría', description: 'Trazabilidad de movimientos [F3]' },
  { key: 'cash', label: 'Corte de Turno', description: 'Arqueo Z y balance de gaveta [F4]' },
  {
    key: 'customers',
    label: 'Clientes y Créditos',
    description: 'Cuentas corrientes y cobranza [F5]'
  },
  {
    key: 'reports',
    label: 'Reportes y Analítica',
    description: 'KPIs y métricas comerciales [F6]'
  },
  {
    key: 'settings',
    label: 'Ajustes del Sistema',
    description: 'Configuración general y hardware [F7]'
  }
]

export const ALL_ACTION_PERMISSIONS: PermissionDescriptor<ActionPermission>[] = [
  {
    key: 'CAN_CREATE_PRODUCT',
    label: 'Crear Productos',
    description: 'Registrar productos e importar artículos al catálogo'
  },
  {
    key: 'CAN_EDIT_PRODUCT',
    label: 'Editar Productos',
    description: 'Modificar fichas, códigos, variantes y componentes de combos'
  },
  {
    key: 'CAN_DELETE_PRODUCT',
    label: 'Dar de baja Productos',
    description: 'Desactivar o eliminar lógicamente artículos del catálogo'
  },
  {
    key: 'CAN_MODIFY_PRICE',
    label: 'Modificar Precios',
    description: 'Cambiar costos, precios de venta y tarifas por mayoreo'
  },
  {
    key: 'CAN_ADJUST_STOCK',
    label: 'Ajustar Inventario',
    description: 'Registrar entradas, salidas, lotes y cambios de existencias'
  },
  {
    key: 'CAN_APPLY_DISCOUNT',
    label: 'Aplicar Descuentos',
    description: 'Rebajas porcentuales en carrito'
  },
  {
    key: 'CAN_MANUAL_CASH_MOVEMENTS',
    label: 'Entradas/Salidas de Caja',
    description: 'Gastos y retiros de gaveta'
  },
  {
    key: 'CAN_OVERRIDE_NO_STOCK',
    label: 'Sobreventa con Stock Positivo',
    description: 'Permitir superar las existencias disponibles si aún hay stock'
  },
  {
    key: 'MANAGE_USERS',
    label: 'Gestionar Usuarios',
    description: 'Exclusivo del rol Administrador'
  }
]

/** Claves válidas para validar lo que llega desde IPC antes de persistir. */
export const ALL_PERMISSION_KEYS: PermissionKey[] = [
  ...ALL_MODULE_PERMISSIONS.map((p) => p.key),
  ...ALL_ACTION_PERMISSIONS.map((p) => p.key)
]

/** Permisos completos del Administrador (acceso total al sistema). */
export const ADMIN_PERMISSION_KEYS: PermissionKey[] = [...ALL_PERMISSION_KEYS]

/** Presets por rol: se aplican al crear usuarios o al cambiar de rol. */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  ADMIN: [...ADMIN_PERMISSION_KEYS],
  SUPERVISOR: [
    'pos',
    'inventory',
    'kardex',
    'cash',
    'customers',
    'CAN_CREATE_PRODUCT',
    'CAN_EDIT_PRODUCT',
    'CAN_APPLY_DISCOUNT',
    'CAN_MODIFY_PRICE',
    'CAN_ADJUST_STOCK',
    'CAN_MANUAL_CASH_MOVEMENTS',
    'CAN_OVERRIDE_NO_STOCK'
  ],
  CASHIER: ['pos', 'cash', 'CAN_APPLY_DISCOUNT', 'CAN_MANUAL_CASH_MOVEMENTS']
}

export function isValidPermissionKey(key: string): key is PermissionKey {
  return (ALL_PERMISSION_KEYS as string[]).includes(key)
}

/** Filtra y deduplica claves de permiso recibidas de fuentes externas. */
export function sanitizePermissionKeys(keys: unknown): PermissionKey[] {
  if (!Array.isArray(keys)) return []
  return Array.from(
    new Set(
      keys.filter((k): k is PermissionKey => typeof k === 'string' && isValidPermissionKey(k))
    )
  )
}

export interface CreateUserInput {
  username: string
  email: string
  name: string
  password: string
  pin?: string
  role: UserRole
  permissions?: string[]
  branch?: string
  station?: string
}

export interface UpdateUserInput {
  id: string
  username?: string
  email?: string
  name?: string
  password?: string
  pin?: string
  role?: UserRole
  permissions?: string[]
  active?: boolean
  branch?: string
  station?: string
}

export interface UsersApi {
  list(): Promise<User[]>
  getById(id: string): Promise<User | null>
  create(input: CreateUserInput): Promise<User>
  update(input: UpdateUserInput): Promise<User>
  delete(id: string): Promise<void>
  toggleStatus(id: string): Promise<User>
}
