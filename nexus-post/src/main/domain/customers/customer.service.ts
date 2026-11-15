import type {
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerDebt,
  CustomerPayment,
  CustomerAccountSummary
} from '@shared/contracts'
import type { CustomerRepository } from '../../ports/customer.repository'
import type { AuthService } from '../auth/auth.service'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Servicio de dominio de clientes, crédito y cobranza.
 *
 * Reglas de negocio:
 * - Listar y ver detalles de clientes: disponible para cualquier sesión autenticada.
 * - Crear, editar, desactivar, eliminar clientes: requiere rol ADMIN.
 * - Registrar pagos/abonos: disponible para cajeros y administradores.
 * - Crear ventas a crédito: disponible para cajeros y administradores.
 * - El código del cliente debe ser único.
 * - El límite de crédito no puede ser negativo.
 * - La deuda actual no puede exceder el límite de crédito (validación suave).
 */
export class CustomerService {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly auth: AuthService
  ) {}

  private requireAdminSession(): { name: string } {
    const session = this.auth.getSessionUser()
    if (!session) {
      throw new Error('No hay una sesión activa. Inicie sesión nuevamente.')
    }
    if (session.role !== 'ADMIN') {
      throw new Error(
        'Acceso denegado: solo el Administrador puede gestionar clientes.'
      )
    }
    return { name: session.name }
  }

  private requireCashierOrAdmin(): { name: string } {
    const session = this.auth.getSessionUser()
    if (!session) {
      throw new Error('No hay una sesión activa. Inicie sesión nuevamente.')
    }
    if (session.role !== 'ADMIN' && session.role !== 'CASHIER') {
      throw new Error(
        'Acceso denegado: solo el Administrador o Cajero pueden registrar pagos y ventas a crédito.'
      )
    }
    return { name: session.name }
  }

  /** Lista clientes aplicando filtros. */
  list(filter?: CustomerFilter): Customer[] {
    return this.repository.list(filter)
  }

  /** Obtiene un cliente por su id. */
  getById(id: string): Customer | null {
    return this.repository.getById(id)
  }

  /** Crea un nuevo cliente (solo ADMIN). */
  create(input: CustomerInput): Customer {
    this.requireAdminSession()

    const code = (input.code ?? '').trim().toUpperCase()
    const name = (input.name ?? '').trim()
    const taxId = (input.taxId ?? '').trim()
    const phone = (input.phone ?? '').trim()
    const email = (input.email ?? '').trim()
    const address = (input.address ?? '').trim()
    const creditLimit = Number(input.creditLimit)

    if (!code || !name) {
      throw new Error('El código y el nombre del cliente son obligatorios.')
    }
    if (email && !EMAIL_RE.test(email)) {
      throw new Error('El correo electrónico no tiene un formato válido.')
    }
    if (!Number.isFinite(creditLimit) || creditLimit < 0) {
      throw new Error('El límite de crédito no puede ser negativo.')
    }

    // Verificar código único
    const existing = this.repository
      .list()
      .find((c) => c.code === code)
    if (existing) {
      throw new Error(`El código de cliente "${code}" ya está registrado.`)
    }

    return this.repository.create({
      code,
      name,
      taxId,
      phone,
      email,
      address,
      creditLimit
    })
  }

  /** Actualiza los datos de un cliente (solo ADMIN). */
  update(input: CustomerUpdateInput): Customer {
    this.requireAdminSession()

    const current = this.repository.getById(input.id)
    if (!current) {
      throw new Error(`Cliente con id "${input.id}" no encontrado.`)
    }

    const code = (input.code ?? current.code).trim().toUpperCase()
    const name = (input.name ?? current.name).trim()
    const taxId = (input.taxId ?? current.taxId).trim()
    const phone = (input.phone ?? current.phone).trim()
    const email = (input.email ?? current.email).trim()
    const address = (input.address ?? current.address).trim()
    const creditLimit =
      input.creditLimit !== undefined ? Number(input.creditLimit) : current.creditLimit

    if (!code || !name) {
      throw new Error('El código y el nombre del cliente son obligatorios.')
    }
    if (email && !EMAIL_RE.test(email)) {
      throw new Error('El correo electrónico no tiene un formato válido.')
    }
    if (!Number.isFinite(creditLimit) || creditLimit < 0) {
      throw new Error('El límite de crédito no puede ser negativo.')
    }

    // Verificar código único (excluyendo el actual)
    const codeConflict = this.repository
      .list()
      .find((c) => c.code === code && c.id !== input.id)
    if (codeConflict) {
      throw new Error(`El código de cliente "${code}" ya está registrado por otro cliente.`)
    }

    return this.repository.update({
      id: input.id,
      code,
      name,
      taxId,
      phone,
      email,
      address,
      creditLimit
    })
  }

  /** Baja lógica del cliente (solo ADMIN). */
  delete(id: string): void {
    this.requireAdminSession()
    const current = this.repository.getById(id)
    if (!current) {
      throw new Error(`Cliente con id "${id}" no encontrado.`)
    }
    if (current.currentDebt > 0) {
      throw new Error(
        `No se puede eliminar el cliente "${current.name}" porque tiene una deuda pendiente de ${current.currentDebt.toFixed(2)}.`
      )
    }
    this.repository.delete(id)
  }

  /** Activa / desactiva la cuenta del cliente (solo ADMIN). */
  toggleStatus(id: string): Customer {
    this.requireAdminSession()
    const customer = this.repository.getById(id)
    if (!customer) {
      throw new Error(`Cliente con id "${id}" no encontrado.`)
    }
    if (customer.active && customer.currentDebt > 0) {
      throw new Error(
        `No se puede desactivar al cliente "${customer.name}" porque tiene una deuda pendiente de ${customer.currentDebt.toFixed(2)}.`
      )
    }
    return this.repository.toggleStatus(id)
  }

  /** Obtiene el resumen de cuenta del cliente (disponible para cualquier sesión). */
  getAccountSummary(customerId: string): CustomerAccountSummary | null {
    return this.repository.getAccountSummary(customerId)
  }

  /** Lista deudas pendientes de un cliente (disponible para cualquier sesión). */
  listDebts(customerId: string): CustomerDebt[] {
    return this.repository.listDebts(customerId)
  }

  /** Lista pagos realizados por un cliente (disponible para cualquier sesión). */
  listPayments(customerId: string): CustomerPayment[] {
    return this.repository.listPayments(customerId)
  }

  /** Registra un pago/abono a la cuenta de un cliente (cajero o admin). */
  recordPayment(
    customerId: string,
    amount: number,
    concept: string
  ): CustomerPayment {
    const session = this.requireCashierOrAdmin()

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('El monto del abono debe ser mayor a 0.')
    }

    const customer = this.repository.getById(customerId)
    if (!customer) {
      throw new Error(`Cliente con id "${customerId}" no encontrado.`)
    }
    if (amount > customer.currentDebt) {
      throw new Error('El abono no puede ser mayor que la deuda actual del cliente.')
    }

    return this.repository.recordPayment(customerId, amount, concept, session.name)
  }

  /** Crea una venta a crédito para un cliente (cajero o admin). */
  createCreditSale(
    customerId: string,
    ticketNumber: string,
    totalAmount: number,
    date: string
  ): CustomerDebt {
    this.requireCashierOrAdmin()

    const customer = this.repository.getById(customerId)
    if (!customer) {
      throw new Error(`Cliente con id "${customerId}" no encontrado.`)
    }
    if (!customer.active) {
      throw new Error(`El cliente "${customer.name}" está desactivado.`)
    }
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error('El total de la venta a crédito debe ser mayor a 0.')
    }
    if (!ticketNumber.trim()) {
      throw new Error('El folio de la venta es obligatorio para generar la deuda.')
    }

    const newDebt = customer.currentDebt + totalAmount
    if (newDebt > customer.creditLimit) {
      throw new Error(
        `La venta excedería el límite de crédito de ${customer.name} (${customer.creditLimit.toFixed(2)}).`
      )
    }

    return this.repository.createCreditSale(customerId, ticketNumber.trim(), totalAmount, date)
  }

  /** Aplica un pago a una deuda específica (cajero o admin). */
  applyPaymentToDebt(debtId: string, amount: number): CustomerDebt {
    const session = this.requireCashierOrAdmin()
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('El monto del abono debe ser mayor a 0.')
    }
    return this.repository.applyPaymentToDebt(debtId, amount, session.name)
  }
}
