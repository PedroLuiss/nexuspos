import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration007UserPermissions: Migration = {
  version: 7,
  name: 'user_permissions',
  up(db: Database.Database): void {
    const tableInfo = db.prepare("PRAGMA table_info('users')").all() as Array<{ name: string }>
    const hasPermissions = tableInfo.some((col) => col.name === 'permissions')

    if (!hasPermissions) {
      db.exec(`
        ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]';
      `)
    }

    const adminPermissions = JSON.stringify([
      'pos',
      'inventory',
      'kardex',
      'cash',
      'customers',
      'reports',
      'settings',
      'manage_users',
      'CAN_CREATE_PRODUCT',
      'CAN_EDIT_PRODUCT',
      'CAN_DELETE_PRODUCT',
      'CAN_MODIFY_PRICE',
      'CAN_ADJUST_STOCK',
      'CAN_APPLY_DISCOUNT',
      'CAN_MANUAL_CASH_MOVEMENTS',
      'CAN_OVERRIDE_NO_STOCK',
      'MANAGE_USERS'
    ])

    const cashierPermissions = JSON.stringify(['pos', 'cash', 'CAN_APPLY_DISCOUNT'])

    // Asignar permisos completos a administradores existentes
    db.prepare(`UPDATE users SET permissions = ? WHERE role = 'ADMIN'`).run(adminPermissions)

    // Asignar permisos básicos a cajeros existentes
    db.prepare(`UPDATE users SET permissions = ? WHERE role = 'CASHIER'`).run(cashierPermissions)
  }
}
