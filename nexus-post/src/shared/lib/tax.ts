/**
 * Motor de cálculo de impuestos multi-tasa.
 *
 * Vive en `src/shared/lib` porque lo consumen **main** y **renderer**:
 * el backend recalcula la venta y el POS la muestra en pantalla. Una sola
 * implementación evita diferencias de centavos al validar el cobro.
 */
import type { SaleTaxLine } from '../contracts/sales.contract'
import type { ProductPriceTier } from '../contracts/product-price-tier.contract'
import { resolveUnitPrice } from './product-pricing'

export const roundMoney = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100

export interface TaxCalculationConfig {
  /** Interruptor global de Ajustes: si está apagado no se traslada impuesto. */
  taxEnabled: boolean
  /** `true` cuando el precio de venta ya contiene el impuesto. */
  pricesIncludeTax: boolean
}

export interface SaleLineInput {
  /** Precio base del producto (sin aplicar descuentos ni escalas). */
  unitPrice: number
  quantity: number
  discountPercent: number
  taxRate: number
  taxName: string
  taxId?: string
  /** Escalas de mayoreo del producto; se aplican según la cantidad. */
  priceTiers?: ProductPriceTier[]
}

export interface SaleTotals {
  subtotal: number
  discount: number
  net: number
  /** Base gravable (tasa > 0). */
  taxableBase: number
  /** Base exenta (tasa = 0). */
  exemptBase: number
  tax: number
  total: number
  taxBreakdown: SaleTaxLine[]
}

/** Normaliza una tasa: finita, entre 0 y 100 y con 2 decimales como máximo. */
export function normalizeTaxRate(value: unknown): number {
  const rate = Number(value)
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return Math.min(100, roundMoney(rate))
}

/** Formatea una tasa para etiquetas: 16 -> "16%", 8.5 -> "8.5%". */
export function formatTaxRate(rate: number): string {
  const safe = normalizeTaxRate(rate)
  return Number.isInteger(safe) ? `${safe}%` : `${safe.toFixed(2).replace(/\.?0+$/, '')}%`
}

/** Etiqueta completa de una tasa: "IVA General (16%)" o "Exento". */
export function formatTaxLabel(name: string | undefined, rate: number): string {
  const label = (name ?? '').trim() || 'Impuesto'
  if (normalizeTaxRate(rate) <= 0) return label.toLowerCase().includes('exent') ? label : 'Exento'
  return `${label} (${formatTaxRate(rate)})`
}

/**
 * Impuesto contenido o trasladado de una base gravable.
 * Si el precio ya incluye impuesto, se desagrega en lugar de sumarse.
 */
export function computeTaxAmountForBase(
  base: number,
  rate: number,
  pricesIncludeTax: boolean
): number {
  const safeRate = normalizeTaxRate(rate)
  if (safeRate <= 0 || base === 0) return 0
  const factor = safeRate / 100
  if (pricesIncludeTax) return base - base / (1 + factor)
  return base * factor
}

/**
 * Resuelve la tasa efectiva de un producto.
 * - Productos nuevos llegan con `taxRate` (join del catálogo).
 * - Productos legados solo traen `hasTax`; se usa la tasa global como respaldo.
 */
export function resolveProductTax(
  product: { taxId?: string; taxName?: string; taxRate?: number; hasTax?: boolean },
  config: { taxName: string; taxRate: number }
): { taxId?: string; taxName: string; taxRate: number } {
  if (typeof product.taxRate === 'number' && Number.isFinite(product.taxRate)) {
    return {
      taxId: product.taxId,
      taxName: (product.taxName ?? '').trim() || config.taxName || 'IVA',
      taxRate: normalizeTaxRate(product.taxRate)
    }
  }
  if (product.hasTax === false) {
    return { taxId: product.taxId, taxName: 'Exento', taxRate: 0 }
  }
  return {
    taxId: product.taxId,
    taxName: config.taxName || 'IVA',
    taxRate: normalizeTaxRate(config.taxRate)
  }
}

/**
 * Calcula subtotal, descuento, desglose por tasa, impuesto y total de una venta.
 * Agrupa por `taxId` (o nombre + tasa cuando el producto no tiene id).
 */
export function computeSaleTotals(
  lines: SaleLineInput[],
  config: TaxCalculationConfig
): SaleTotals {
  const groups = new Map<
    string,
    { taxId?: string; taxName: string; taxRate: number; base: number }
  >()
  let subtotal = 0
  let discount = 0

  for (const line of lines) {
    const basePrice = Math.max(0, Number(line.unitPrice) || 0)
    const quantity = Math.max(0, Number(line.quantity) || 0)
    const discountPercent = Math.min(100, Math.max(0, Number(line.discountPercent) || 0))
    // Precio efectivo tras aplicar escalas de mayoreo según la cantidad.
    const unitPrice = resolveUnitPrice(line.priceTiers, quantity, basePrice)
    const gross = unitPrice * quantity
    const lineDiscount = (gross * discountPercent) / 100
    subtotal += gross
    discount += lineDiscount

    const rate = config.taxEnabled ? normalizeTaxRate(line.taxRate) : 0
    const taxName = (line.taxName ?? '').trim() || (rate > 0 ? 'Impuesto' : 'Exento')
    const key = `${line.taxId ?? `${taxName}:${rate}`}|${rate}`
    const group = groups.get(key)
    if (group) group.base += gross - lineDiscount
    else {
      groups.set(key, { taxId: line.taxId, taxName, taxRate: rate, base: gross - lineDiscount })
    }
  }

  const net = roundMoney(subtotal - discount)

  if (!config.taxEnabled) {
    return {
      subtotal: roundMoney(subtotal),
      discount: roundMoney(discount),
      net,
      taxableBase: 0,
      exemptBase: net,
      tax: 0,
      total: net,
      taxBreakdown: []
    }
  }

  let taxableBase = 0
  let exemptBase = 0
  const taxBreakdown: SaleTaxLine[] = []

  for (const group of groups.values()) {
    const base = roundMoney(group.base)
    if (base === 0) continue
    if (group.taxRate > 0) taxableBase += base
    else exemptBase += base
    taxBreakdown.push({
      taxId: group.taxId,
      taxName: group.taxName,
      taxRate: group.taxRate,
      taxableBase: base,
      amount: roundMoney(computeTaxAmountForBase(base, group.taxRate, config.pricesIncludeTax))
    })
  }

  taxBreakdown.sort((a, b) => b.taxRate - a.taxRate)
  const tax = roundMoney(taxBreakdown.reduce((acc, line) => acc + line.amount, 0))
  const total = config.pricesIncludeTax ? net : roundMoney(net + tax)

  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    net,
    taxableBase: roundMoney(taxableBase),
    exemptBase: roundMoney(exemptBase),
    tax,
    total,
    taxBreakdown
  }
}
