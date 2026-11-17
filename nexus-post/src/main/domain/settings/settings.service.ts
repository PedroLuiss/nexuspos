import type {
  BusinessConfig,
  BusinessConfigInput,
  CurrencyCode,
  TaxIdType
} from '@shared/contracts'
import { CURRENCY_OPTIONS, TAX_ID_TYPE_OPTIONS } from '@shared/contracts'
import type { SettingsRepository } from '../../ports/settings.repository'
import type { AuthService } from '../auth/auth.service'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_TAX_RATE = 100
const TAX_ID_TYPES = TAX_ID_TYPE_OPTIONS.map((t) => t.value)
const CURRENCIES = CURRENCY_OPTIONS.map((c) => c.code)

function clean(value: unknown, maxLength = 200): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

/**
 * Servicio de dominio de configuración del negocio, ticket e impuestos.
 * Adaptado para operación en Venezuela:
 * - Identificación fiscal: RIF (formato J-00000000-0).
 * - Monedas soportadas: VES, USD, EUR (extensible).
 * - País: Venezuela.
 *
 * Reglas de negocio:
 * - La lectura es pública para cualquier sesión (el POS necesita la tasa de IVA).
 * - La escritura requiere sesión con rol ADMIN (datos fiscales y tributarios).
 * - La tasa de impuesto (IVA) debe ser un porcentaje válido entre 0 y 100.
 * - Moneda y tipo de identificación fiscal deben pertenecer al catálogo soportado.
 * - Si se usa RIF, el número debe tener formato válido ante el SENIAT.
 */
export class SettingsService {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly auth: AuthService
  ) {}

  private requireAdminSession(): { name: string } {
    const session = this.auth.getSessionUser()
    if (!session) {
      throw new Error('No hay una sesión activa. Inicie sesión nuevamente.')
    }
    if (session.role !== 'ADMIN') {
      throw new Error(
        'Acceso denegado: solo el Administrador puede modificar los datos del negocio y los impuestos.'
      )
    }
    return { name: session.name }
  }

  getBusiness(): BusinessConfig {
    return this.repository.getBusiness()
  }

  updateBusiness(input: BusinessConfigInput): BusinessConfig {
    const session = this.requireAdminSession()

    const legalName = clean(input.legalName, 160)
    const tradeName = clean(input.tradeName, 120)
    const taxIdType = input.taxIdType
    const taxId = clean(input.taxId, 40).toUpperCase()
    const taxRegime = clean(input.taxRegime, 120)
    const ownerName = clean(input.ownerName, 120)
    const ownerTaxId = clean(input.ownerTaxId, 40).toUpperCase()
    const email = clean(input.email, 120).toLowerCase()
    const phone = clean(input.phone, 30)
    const mobile = clean(input.mobile, 30)
    const website = clean(input.website, 160)
    const address = clean(input.address, 200)
    const district = clean(input.district, 80)
    const city = clean(input.city, 80)
    const state = clean(input.state, 80)
    const municipality = clean(input.municipality, 80)
    const parish = clean(input.parish, 80)
    const country = clean(input.country, 80) || 'Venezuela'
    const postalCode = clean(input.postalCode, 12)
    const currency = input.currency
    const ticketHeader = clean(input.ticketHeader, 120)
    const ticketFooter = clean(input.ticketFooter, 200)
    const ticketLegalNote = clean(input.ticketLegalNote, 200)
    const taxName = clean(input.taxName, 20)
    const taxRate = Number(input.taxRate)

    if (!legalName) {
      throw new Error('La razón social del negocio es obligatoria.')
    }
    if (!TAX_ID_TYPES.includes(taxIdType)) {
      throw new Error('El tipo de identificación fiscal no es válido.')
    }
    if (taxIdType === 'RIF' && !taxId) {
      throw new Error('El RIF es obligatorio cuando el tipo de documento es RIF.')
    }
    if (taxIdType !== 'NONE' && !taxId) {
      throw new Error('El número de identificación fiscal (RIF) es obligatorio.')
    }
    if (email && !EMAIL_RE.test(email)) {
      throw new Error('El correo electrónico del negocio no tiene un formato válido.')
    }
    if (!CURRENCIES.includes(currency)) {
      throw new Error('La moneda seleccionada no está soportada.')
    }
    if (input.taxEnabled && !taxName) {
      throw new Error('Indique el nombre del impuesto (IVA).')
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > MAX_TAX_RATE) {
      throw new Error(`La tasa de impuesto debe estar entre 0 y ${MAX_TAX_RATE}%.`)
    }

    const sanitized: BusinessConfigInput = {
      legalName,
      tradeName,
      taxIdType: taxIdType as TaxIdType,
      taxId,
      taxRegime,
      ownerName,
      ownerTaxId,
      email,
      phone,
      mobile,
      website,
      address,
      district,
      city,
      state,
      municipality,
      parish,
      country,
      postalCode,
      currency: currency as CurrencyCode,
      ticketHeader,
      ticketFooter,
      ticketLegalNote,
      ticketShowTaxId: Boolean(input.ticketShowTaxId),
      ticketShowAddress: Boolean(input.ticketShowAddress),
      ticketShowCashier: Boolean(input.ticketShowCashier),
      taxEnabled: Boolean(input.taxEnabled),
      taxName: taxName || 'IVA',
      taxRate,
      pricesIncludeTax: Boolean(input.pricesIncludeTax)
    }

    return this.repository.updateBusiness(sanitized, session.name)
  }
}
