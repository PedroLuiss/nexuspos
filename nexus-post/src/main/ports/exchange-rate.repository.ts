export interface CachedExchangeRate {
  rate: number
  updatedAt: string
}

export interface ExchangeRateRepository {
  getBcvUsdVes(): CachedExchangeRate | null
  saveBcvUsdVes(rate: CachedExchangeRate): void
}
