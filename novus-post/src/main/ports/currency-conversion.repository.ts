import type { CurrencyCode } from '@shared/contracts'

export interface CurrencyConversion {
  fromCurrency: CurrencyCode
  toCurrency: CurrencyCode
  fromRateToVes: number
  toRateToVes: number
  multiplier: number
  changedAt: string
  changedBy: string
}

export interface CurrencyConversionRepository {
  hasOpenCashShift(): boolean
  convertOperationalAmounts(conversion: CurrencyConversion): void
}
