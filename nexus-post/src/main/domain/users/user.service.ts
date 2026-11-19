import type { CreateUserInput, UpdateUserInput, User, UserRole } from '@shared/contracts'
import { ROLE_DEFAULT_PERMISSIONS, sanitizePermissionKeys } from '@shared/contracts'
import type { UserRepository } from '../../ports/user.repository'
import type { PasswordHasher } from '../../ports/password-hasher.port'
import type { AuthService } from '../auth/auth.service'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PIN_RE = /^\d{4}$/
const VALID_ROLES: UserRole[] = ['ADMIN', 'SUPERVISOR', 'CASHIER']
const MIN_PASSWORD_LENGTH = 8

/**
 * Servicio de dominio para la gestión de usuarios y permisos (RBAC).
 *
 * Reglas de negocio:
 * - Solo una sesión con rol ADMIN puede listar, crear, editar o desactivar usuarios.
 * - No se permite que el administrador se elimine o desactive a sí mismo.
 * - El sistema debe conservar siempre al menos un administrador activo.
 * - Los permisos se sanean contra el catálogo de `@shared/contracts` antes de persistirse.
 */
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auth: AuthService,
    private readonly passwordHasher: PasswordHasher
  ) {}

  private requireAdminSession(): User {
    const session = this.auth.getSessionUser()
    if (!session) {
      throw new Error('No hay una sesión activa. Inicie sesión nuevamente.')
    }
    if (session.role !== 'ADMIN') {
      throw new Error('Acceso denegado: solo el Administrador puede gestionar usuarios y permisos.')
    }
    return session
  }

  private ensureUniqueIdentity(username: string, email: string, excludeId?: string): void {
    const byEmail = this.userRepository.findByEmail(email)
    if (byEmail && byEmail.id !== excludeId) {
      throw new Error(
        byEmail.active
          ? `El correo "${email}" ya está registrado por otro usuario.`
          : `El correo "${email}" pertenece a un usuario eliminado. Reactive ese registro en lugar de crear uno nuevo.`
      )
    }

    const byUsername = this.userRepository.findByUsername(username)
    if (byUsername && byUsername.id !== excludeId) {
      throw new Error(
        byUsername.active
          ? `El usuario "${username}" ya está en uso.`
          : `El usuario "${username}" pertenece a un registro eliminado. Reactive ese registro en lugar de crear uno nuevo.`
      )
    }
  }

  private activeAdminsExcluding(excludeId: string): User[] {
    return this.userRepository
      .findAll(false)
      .filter((u) => u.role === 'ADMIN' && u.id !== excludeId)
  }

  private assertAnotherAdminExists(excludeId: string): void {
    if (this.activeAdminsExcluding(excludeId).length === 0) {
      throw new Error('Debe existir al menos un administrador activo en el sistema.')
    }
  }

  list(): User[] {
    this.requireAdminSession()
    return this.userRepository.findAll(true)
  }

  getById(id: string): User | null {
    this.requireAdminSession()
    return this.userRepository.findById(id)
  }

  create(input: CreateUserInput): User {
    this.requireAdminSession()

    const username = (input.username ?? '').trim().toLowerCase()
    const email = (input.email ?? '').trim().toLowerCase()
    const name = (input.name ?? '').trim()
    const role = input.role
    const pin = input.pin?.trim() ?? ''

    if (!username || !email || !name) {
      throw new Error('Nombre, usuario y correo electrónico son obligatorios.')
    }
    if (!EMAIL_RE.test(email)) {
      throw new Error('El correo electrónico no tiene un formato válido.')
    }
    if (!VALID_ROLES.includes(role)) {
      throw new Error('El rol seleccionado no es válido.')
    }
    if (!input.password?.trim() || input.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }
    if (pin && !PIN_RE.test(pin)) {
      throw new Error('El PIN de caja debe tener exactamente 4 dígitos numéricos.')
    }

    this.ensureUniqueIdentity(username, email)

    const permissions = sanitizePermissionKeys(input.permissions)
    return this.userRepository.create({
      ...input,
      password: this.passwordHasher.hash(input.password),
      username,
      email,
      name,
      pin: pin || undefined,
      permissions: permissions.length > 0 ? permissions : [...ROLE_DEFAULT_PERMISSIONS[role]]
    })
  }

  update(input: UpdateUserInput): User {
    const session = this.requireAdminSession()
    const current = this.userRepository.findById(input.id)
    if (!current) {
      throw new Error(`Usuario con id "${input.id}" no encontrado.`)
    }

    const nextRole = input.role ?? current.role
    const nextActive = input.active ?? current.active
    const isSelf = session.id === current.id

    if (!VALID_ROLES.includes(nextRole)) {
      throw new Error('El rol seleccionado no es válido.')
    }
    if (isSelf && nextRole !== current.role) {
      throw new Error('No puede cambiar su propio rol de Administrador.')
    }
    if (isSelf && nextActive === false) {
      throw new Error('No puede desactivar su propia cuenta mientras tiene la sesión abierta.')
    }
    if (current.role === 'ADMIN' && (nextRole !== 'ADMIN' || nextActive === false)) {
      this.assertAnotherAdminExists(current.id)
    }

    const username =
      input.username !== undefined ? input.username.trim().toLowerCase() : current.username
    const email = input.email !== undefined ? input.email.trim().toLowerCase() : current.email

    if (!username) throw new Error('El nombre de usuario no puede quedar vacío.')
    if (!EMAIL_RE.test(email)) {
      throw new Error('El correo electrónico no tiene un formato válido.')
    }
    this.ensureUniqueIdentity(username, email, current.id)

    if (
      input.password !== undefined &&
      input.password.trim().length > 0 &&
      input.password.length < MIN_PASSWORD_LENGTH
    ) {
      throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }
    if (input.pin !== undefined && input.pin.trim().length > 0 && !PIN_RE.test(input.pin.trim())) {
      throw new Error('El PIN de caja debe tener exactamente 4 dígitos numéricos.')
    }

    let permissions: string[] | undefined
    if (input.permissions !== undefined) {
      permissions = sanitizePermissionKeys(input.permissions)
    } else if (input.role !== undefined && input.role !== current.role) {
      // Al cambiar de rol sin enviar permisos explícitos se aplica el preset del nuevo rol.
      permissions = [...ROLE_DEFAULT_PERMISSIONS[input.role]]
    }

    const password =
      input.password && input.password.trim().length > 0
        ? this.passwordHasher.hash(input.password)
        : input.password

    return this.userRepository.update({
      ...input,
      password,
      username,
      email,
      permissions
    })
  }

  delete(id: string): void {
    const session = this.requireAdminSession()
    const target = this.userRepository.findById(id)
    if (!target) {
      throw new Error(`Usuario con id "${id}" no encontrado.`)
    }
    if (target.id === session.id) {
      throw new Error('No puede eliminar su propia cuenta de Administrador.')
    }
    if (target.role === 'ADMIN' && target.active) {
      this.assertAnotherAdminExists(target.id)
    }
    this.userRepository.delete(id)
  }

  toggleStatus(id: string): User {
    const session = this.requireAdminSession()
    const target = this.userRepository.findById(id)
    if (!target) {
      throw new Error(`Usuario con id "${id}" no encontrado.`)
    }
    if (target.id === session.id && target.active) {
      throw new Error('No puede desactivar su propia cuenta mientras tiene la sesión abierta.')
    }
    if (target.role === 'ADMIN' && target.active) {
      this.assertAnotherAdminExists(target.id)
    }
    return this.userRepository.toggleStatus(id)
  }
}
