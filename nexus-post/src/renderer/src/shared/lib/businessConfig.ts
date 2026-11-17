import type { BusinessConfig, CurrencyCode } from '@shared/contracts'
import { CURRENCY_OPTIONS } from '@shared/contracts'

/**
 * Configuración de demostración para Venezuela.
 * Usada como valor inicial del contexto (preview web de Vite o primer render
 * antes de leer SQLite). Los datos reales siempre provienen de `business_settings`.
 */
export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  legalName: 'COMERCIAL LOS ANDES C.A.',
  tradeName: 'Nexus Market Venezuela',
  taxIdType: 'RIF',
  taxId: 'J-00000000-0',
  taxRegime: 'Régimen General - Persona Jurídica',
  ownerName: 'Carlos Morales',
  ownerTaxId: 'V-12345678',
  email: 'contacto@nexusmarket.com.ve',
  phone: '+58 212-555.0199',
  mobile: '+58 412-555.0199',
  website: 'https://www.nexusmarket.com.ve',
  address: 'Av. Francisco Fajardo, Edificio Los Andes, Piso 1',
  district: 'El Paraíso',
  city: 'Caracas',
  state: 'Distrito Capital',
  municipality: 'Libertador',
  parish: 'Altagracia',
  country: 'Venezuela',
  postalCode: '1010',
  currency: 'USD',
  ticketHeader: '¡Bienvenidos a Nexus Market Venezuela!',
  ticketFooter: 'Gracias por su compra. Conserve este ticket para cambios o devoluciones.',
  ticketLegalNote: 'Documento no fiscal. RIF: J-00000000-0. Sujeto a regulación del SENIAT.',
  ticketShowTaxId: true,
  ticketShowAddress: true,
  ticketShowCashier: true,
  taxEnabled: true,
  taxName: 'IVA',
  taxRate: 16,
  pricesIncludeTax: false
}

export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCY_OPTIONS.find((c) => c.code === code)?.symbol ?? 'Bs.'
}

/** Dirección fiscal en una sola línea lista para imprimir en el ticket (formato Venezuela). */
export function formatBusinessAddress(
  config: Pick<
    BusinessConfig,
    'address' | 'district' | 'city' | 'state' | 'municipality' | 'parish' | 'country'
  >
): string {
  const parts = [
    config.address,
    config.district,
    config.city,
    config.state,
    config.municipality,
    config.parish,
    config.country
  ]
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.join(', ')
}

/** Etiqueta del impuesto para tickets y resúmenes (p. ej. "IVA (16%)"). */
export function getTaxLabel(
  config: Pick<BusinessConfig, 'taxEnabled' | 'taxName' | 'taxRate'>
): string {
  if (!config.taxEnabled || config.taxRate <= 0) return config.taxName || 'Impuesto'
  const rate = Number.isInteger(config.taxRate) ? config.taxRate : config.taxRate.toFixed(2)
  return `${config.taxName || 'IVA'} (${rate}%)`
}

/**
 * Monto de impuesto trasladado de una base gravable.
 * Si los precios ya incluyen impuesto, se desagrega del precio en lugar de sumarse.
 */
export function computeTaxAmount(
  taxableAmount: number,
  config: Pick<BusinessConfig, 'taxEnabled' | 'taxRate' | 'pricesIncludeTax'>
): number {
  if (!config.taxEnabled || config.taxRate <= 0 || taxableAmount === 0) return 0
  const rate = config.taxRate / 100
  if (config.pricesIncludeTax) return taxableAmount - taxableAmount / (1 + rate)
  return taxableAmount * rate
}

/** Total a cobrar considerando si el impuesto se suma o ya está incluido en el precio. */
export function computeGrandTotal(
  netAmount: number,
  taxableAmount: number,
  config: Pick<BusinessConfig, 'taxEnabled' | 'taxRate' | 'pricesIncludeTax'>
): number {
  if (config.taxEnabled && !config.pricesIncludeTax) {
    return netAmount + computeTaxAmount(taxableAmount, config)
  }
  return netAmount
}

/** Etiqueta corta para precios de producto: "IVA 16%" o "Sin impuesto". */
export function getProductTaxLabel(
  config: Pick<BusinessConfig, 'taxEnabled' | 'taxName' | 'taxRate'>
): string {
  if (!config.taxEnabled || config.taxRate <= 0) return 'Sin impuesto'
  return `${config.taxName || 'IVA'} ${config.taxRate}%`
}

/** Valida el formato básico de un RIF venezolano: Prefijo + 8 dígitos + dígito verificador (ej. J-00000000-0). */
export function isValidRif(rif: string): boolean {
  const cleaned = rif.trim().toUpperCase()
  const pattern = /^[JVEGP]-\d{8}-\d$/
  return pattern.test(cleaned)
}
