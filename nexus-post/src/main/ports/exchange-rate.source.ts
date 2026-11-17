import type { CachedExchangeRate } from './exchange-rate.repository'

export interface ExchangeRateSource {
  fetchBcvUsdVes(): Promise<CachedExchangeRate>
}
