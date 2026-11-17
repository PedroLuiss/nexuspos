import type { UsdVesExchangeRate } from '@shared/contracts'
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
    let latest: CachedExchangeRate
    try {
      latest = await this.source.fetchBcvUsdVes()
    } catch (error) {
      const cached = this.repository.getBcvUsdVes()
      if (!cached) {
        const detail = error instanceof Error ? ` ${error.message}` : ''
        throw new Error(`No hay una tasa BCV guardada y no se pudo consultar la API.${detail}`)
      }
      return this.toContract(cached.rate, cached.updatedAt, true)
    }
    this.repository.saveBcvUsdVes(latest)
    return this.toContract(latest.rate, latest.updatedAt)
  }

  private toContract(rate: number, updatedAt: string, isFallback = false): UsdVesExchangeRate {
    return {
      rate,
      updatedAt,
      source: 'BCV',
      isStale: isFallback || Date.now() - Date.parse(updatedAt) > STALE_AFTER_MS
    }
  }
}
