import type { ExchangeRateCurrency } from '@shared/contracts'
import type { CachedExchangeRate } from './exchange-rate.repository'

export interface ExchangeRateSource {
  fetchBcvRate(currency: ExchangeRateCurrency): Promise<CachedExchangeRate>
}
