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

/**
 * Nota: los cálculos fiscales (impuesto por base, desglose multi-tasa y total)
 * viven en `@shared/lib/tax`, que es la única fuente de verdad compartida entre
 * el proceso principal y el renderer. No dupliques esa matemática aquí.
 */

/** Valida el formato básico de un RIF venezolano: Prefijo + 8 dígitos + dígito verificador (ej. J-00000000-0). */
export function isValidRif(rif: string): boolean {
  const cleaned = rif.trim().toUpperCase()
  const pattern = /^[JVEGP]-\d{8}-\d$/
  return pattern.test(cleaned)
}
