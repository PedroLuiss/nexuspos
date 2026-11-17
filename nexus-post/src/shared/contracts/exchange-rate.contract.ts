export interface UsdVesExchangeRate {
  rate: number
  updatedAt: string
  source: 'BCV'
  isStale: boolean
}

export interface ExchangeRateApi {
  getUsdVes(): Promise<UsdVesExchangeRate>
}
