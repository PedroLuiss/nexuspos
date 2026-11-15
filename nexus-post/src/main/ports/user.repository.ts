import type { User, CreateUserInput, UpdateUserInput } from '@shared/contracts'

export type UserWithSecret = User & {
  passwordHash: string
}

/**
 * Puerto de persistencia de usuarios y autenticación.
 * La implementación concreta (SQLite) vive en `main/adapters/persistence/sqlite/`.
 */
export interface UserRepository {
  findByEmailOrUsername(identifier: string): UserWithSecret | null
  /** Búsqueda exacta por usuario incluyendo registros desactivados (soft delete). */
  findByUsername(username: string): UserWithSecret | null
  /** Búsqueda exacta por correo incluyendo registros desactivados (soft delete). */
  findByEmail(email: string): UserWithSecret | null
  findByPin(pin: string): User | null
  findById(id: string): User | null
  findAll(includeInactive?: boolean): User[]
  create(input: CreateUserInput): User
  update(input: UpdateUserInput): User
  delete(id: string): void
  toggleStatus(id: string): User
  updatePassword(id: string, newPassword: string): void
}
