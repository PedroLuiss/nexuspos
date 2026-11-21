import type { ExchangeRateSource } from '../../ports/exchange-rate.source'
import type { CachedExchangeRate } from '../../ports/exchange-rate.repository'
import type { ExchangeRateCurrency } from '@shared/contracts'

interface BcvRateResponse {
  moneda?: unknown
  fuente?: unknown
  promedio?: unknown
  fechaActualizacion?: unknown
}

export class BcvExchangeRateAdapter implements ExchangeRateSource {
  async fetchBcvRate(currency: ExchangeRateCurrency): Promise<CachedExchangeRate> {
    const resource = currency === 'USD' ? 'dolares' : 'euros'
    const response = await fetch(`https://ve.dolarapi.com/v1/${resource}/oficial`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) {
      throw new Error(`La API BCV respondió con estado ${response.status}.`)
    }

    const data = (await response.json()) as BcvRateResponse
    const rate = Number(data.promedio)
    const updatedAt = typeof data.fechaActualizacion === 'string' ? data.fechaActualizacion : ''
    const timestamp = Date.parse(updatedAt)

    if (
      data.moneda !== currency ||
      data.fuente !== 'oficial' ||
      !Number.isFinite(rate) ||
      rate <= 0 ||
      !Number.isFinite(timestamp)
    ) {
      throw new Error(`La API BCV devolvió una tasa ${currency}/VES con formato inválido.`)
    }

    return { rate, updatedAt: new Date(timestamp).toISOString() }
  }
}
