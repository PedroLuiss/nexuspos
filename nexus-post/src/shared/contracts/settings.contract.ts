/**
 * Contrato compartido de Configuración del Negocio, Ticket e Impuestos.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni React.
 *
 * Adaptado para operación en Venezuela:
 * - Monedas: VES (Bolívar Soberano), USD (Dólar), EUR (Euro) — escalable para agregar más.
 * - Identificación fiscal: RIF (Venezuela) con prefijos J, V, E, G, P y NONE.
 * - País por defecto: Venezuela.
 */

/** Tipo de identificación fiscal (RIF venezolano). */
export type TaxIdType = 'RIF' | 'NONE'

/** Monedas soportadas para la operación comercial (escalable: agregar más códigos aquí). */
export type CurrencyCode = 'VES' | 'USD' | 'EUR'

export interface CurrencyOption {
  code: CurrencyCode
  label: string
  symbol: string
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'VES', label: 'Bolívar Soberano', symbol: 'Bs.' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' }
]

/** Tipos de RIF venezolano. El prefijo indica la categoría del contribuyente ante el SENIAT. */
export const TAX_ID_TYPE_OPTIONS: { value: TaxIdType; label: string; prefix: string }[] = [
  { value: 'RIF', label: 'RIF (Venezuela)', prefix: 'J, V, E, G, P' },
  { value: 'NONE', label: 'Sin identificación fiscal', prefix: '—' }
]

/**
 * Configuración única del establecimiento (una fila en SQLite).
 * Agrupa identidad legal, datos del propietario, contacto, domicilio fiscal,
 * plantilla de ticket e impuestos.
 */
export interface BusinessConfig {
  // ── Identidad legal ────────────────────────────────────────────────
  /** Razón social registrada (nombre legal ante el SENIAT). */
  legalName: string
  /** Nombre comercial visible al público. */
  tradeName: string
  taxIdType: TaxIdType
  /** Número de RIF (ej. J-00000000-0). */
  taxId: string
  /** Régimen tributario declarado (texto libre). */
  taxRegime: string
  // ── Propietario / Representante legal ──────────────────────────────
  ownerName: string
  ownerTaxId: string
  // ── Contacto ───────────────────────────────────────────────────────
  email: string
  phone: string
  mobile: string
  website: string
  // ── Domicilio fiscal ───────────────────────────────────────────────
  address: string
  district: string
  city: string
  state: string
  /** Municipio (Venezuela). */
  municipality: string
  /** Parroquia (Venezuela). */
  parish: string
  country: string
  postalCode: string
  // ── Operación ──────────────────────────────────────────────────────
  currency: CurrencyCode
  // ── Plantilla de ticket ────────────────────────────────────────────
  ticketHeader: string
  ticketFooter: string
  /** Leyenda legal impresa al pie (p. ej. "No es comprobante fiscal ante el SENIAT"). */
  ticketLegalNote: string
  ticketShowTaxId: boolean
  ticketShowAddress: boolean
  ticketShowCashier: boolean
  // ── Impuestos ──────────────────────────────────────────────────────
  taxEnabled: boolean
  /** Nombre local del impuesto: IVA (configurable desde Ajustes). */
  taxName: string
  /** Tasa expresada en porcentaje (16 = 16%). */
  taxRate: number
  /** `true` si los precios de venta ya incluyen el impuesto. */
  pricesIncludeTax: boolean
  // ── Auditoría ──────────────────────────────────────────────────────
  updatedAt?: string
  updatedBy?: string
}

/** Datos editables desde Ajustes (sin campos de auditoría). */
export type BusinessConfigInput = Omit<BusinessConfig, 'updatedAt' | 'updatedBy'>

export interface SettingsApi {
  getBusiness(): Promise<BusinessConfig>
  updateBusiness(input: BusinessConfigInput): Promise<BusinessConfig>
}
