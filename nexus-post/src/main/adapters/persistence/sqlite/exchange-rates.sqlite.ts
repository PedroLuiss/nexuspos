import type Database from 'better-sqlite3'
import type {
  CachedExchangeRate,
  ExchangeRateRepository
} from '../../../ports/exchange-rate.repository'

export class SqliteExchangeRateRepository implements ExchangeRateRepository {
  constructor(private readonly db: Database.Database) {}

  getBcvUsdVes(): CachedExchangeRate | null {
    const row = this.db
      .prepare('SELECT rate, updated_at AS updatedAt FROM exchange_rates WHERE id = ?')
      .get('USD_VES_BCV') as CachedExchangeRate | undefined
    return row ?? null
  }

  saveBcvUsdVes(rate: CachedExchangeRate): void {
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
