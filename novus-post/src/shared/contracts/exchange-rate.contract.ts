export type ExchangeRateCurrency = 'USD' | 'EUR'

export interface CurrencyVesExchangeRate {
  currency: ExchangeRateCurrency
  rate: number
  updatedAt: string
  source: 'BCV'
  isStale: boolean
}

export type UsdVesExchangeRate = CurrencyVesExchangeRate & { currency: 'USD' }
export type EurVesExchangeRate = CurrencyVesExchangeRate & { currency: 'EUR' }

export interface ExchangeRateApi {
  getUsdVes(): Promise<UsdVesExchangeRate>
  getEurVes(): Promise<EurVesExchangeRate>
}
