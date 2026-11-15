import type { User } from '@shared/contracts'

export type UserWithSecret = User & {
  passwordHash: string
}

/**
 * Puerto de persistencia de usuarios y autenticación.
 * La implementación concreta (SQLite) vive en `main/adapters/persistence/sqlite/`.
 */
export interface UserRepository {
  findByEmailOrUsername(identifier: string): UserWithSecret | null
  findByPin(pin: string): User | null
  findById(id: string): User | null
  findAll(): User[]
  updatePassword(id: string, newPassword: string): void
}
