import type Database from 'better-sqlite3'
import type { ExchangeRateCurrency } from '@shared/contracts'
import type {
  CachedExchangeRate,
  ExchangeRateRepository
} from '../../../ports/exchange-rate.repository'

export class SqliteExchangeRateRepository implements ExchangeRateRepository {
  constructor(private readonly db: Database.Database) {}

  getBcvRate(currency: ExchangeRateCurrency): CachedExchangeRate | null {
    const id = `${currency}_VES_BCV`
    const row = this.db
      .prepare('SELECT rate, updated_at AS updatedAt FROM currency_exchange_rates WHERE id = ?')
      .get(id) as CachedExchangeRate | undefined

    if (row) return row
    if (currency === 'EUR') return null

    const legacyRow = this.db
      .prepare('SELECT rate, updated_at AS updatedAt FROM exchange_rates WHERE id = ?')
      .get('USD_VES_BCV') as CachedExchangeRate | undefined
    return legacyRow ?? null
  }

  saveBcvRate(currency: ExchangeRateCurrency, rate: CachedExchangeRate): void {
    const id = `${currency}_VES_BCV`
    this.db
      .prepare(
        `
      INSERT INTO currency_exchange_rates (id, currency, rate, updated_at)
      VALUES (@id, @currency, @rate, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        rate = excluded.rate,
        updated_at = excluded.updated_at
    `
      )
      .run({ ...rate, id, currency })

    if (currency === 'USD') {
      this.db
        .prepare(
          `
        INSERT INTO exchange_rates (id, rate, updated_at)
        VALUES ('USD_VES_BCV', @rate, @updatedAt)
        ON CONFLICT(id) DO UPDATE SET
          rate = excluded.rate,
          updated_at = excluded.updated_at
      `
        )
        .run(rate)
    }
  }
}
