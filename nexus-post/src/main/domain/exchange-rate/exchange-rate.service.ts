import type {
  CurrencyVesExchangeRate,
  ExchangeRateCurrency,
  EurVesExchangeRate,
  UsdVesExchangeRate
} from '@shared/contracts'
import type {
  CachedExchangeRate,
  ExchangeRateRepository
} from '../../ports/exchange-rate.repository'
import type { ExchangeRateSource } from '../../ports/exchange-rate.source'

const STALE_AFTER_MS = 36 * 60 * 60 * 1000

export class ExchangeRateService {
  constructor(
    private readonly repository: ExchangeRateRepository,
    private readonly source: ExchangeRateSource
  ) {}

  async getUsdVes(): Promise<UsdVesExchangeRate> {
    return { ...(await this.getCurrencyVes('USD')), currency: 'USD' }
  }

  async getEurVes(): Promise<EurVesExchangeRate> {
    return { ...(await this.getCurrencyVes('EUR')), currency: 'EUR' }
  }

  async getCurrencyVes(currency: ExchangeRateCurrency): Promise<CurrencyVesExchangeRate> {
    let latest: CachedExchangeRate
    try {
      latest = await this.source.fetchBcvRate(currency)
    } catch (error) {
      const cached = this.repository.getBcvRate(currency)
      if (!cached) {
        const detail = error instanceof Error ? ` ${error.message}` : ''
        throw new Error(
          `No hay una tasa BCV ${currency}/VES guardada y no se pudo consultar la API.${detail}`
        )
      }
      return this.toContract(currency, cached.rate, cached.updatedAt, true)
    }
    this.repository.saveBcvRate(currency, latest)
    return this.toContract(currency, latest.rate, latest.updatedAt)
  }

  private toContract(
    currency: ExchangeRateCurrency,
    rate: number,
    updatedAt: string,
    isFallback = false
  ): CurrencyVesExchangeRate {
    return {
      currency,
      rate,
      updatedAt,
      source: 'BCV',
      isStale: isFallback || Date.now() - Date.parse(updatedAt) > STALE_AFTER_MS
    }
  }
}
