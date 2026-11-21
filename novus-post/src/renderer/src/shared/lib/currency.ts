import type { CurrencyCode } from '@shared/contracts'
import { getCurrencySymbol } from './businessConfig'

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
  return `${getCurrencySymbol(currency)} ${formatted}`
}

export function formatVesAmount(amount: number): string {
  return formatCurrency(amount, 'VES')
}

export function formatCurrencyTotals(
  amounts: Array<{ amount: number; currency: CurrencyCode }>
): string {
  const totals = new Map<CurrencyCode, number>()
  for (const { amount, currency } of amounts) {
    totals.set(currency, (totals.get(currency) ?? 0) + amount)
  }
  return [...totals]
    .map(([currency, total]) => formatCurrency(total, currency))
    .join(' · ')
}
