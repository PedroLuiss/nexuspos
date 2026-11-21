import type { ExchangeRateCurrency } from '@shared/contracts'

export interface CachedExchangeRate {
  rate: number
  updatedAt: string
}

export interface ExchangeRateRepository {
  getBcvRate(currency: ExchangeRateCurrency): CachedExchangeRate | null
  saveBcvRate(currency: ExchangeRateCurrency, rate: CachedExchangeRate): void
}
