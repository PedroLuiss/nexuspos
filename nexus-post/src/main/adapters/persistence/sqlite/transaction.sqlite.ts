import type Database from 'better-sqlite3'
import type { TransactionRunner } from '../../../ports/transaction'

/** Ejecuta trabajo dentro de una transacción SQLite. */
export class SqliteTransactionRunner implements TransactionRunner {
  constructor(private readonly db: Database.Database) {}

  run<T>(work: () => T): T {
    return this.db.transaction(work)()
  }
}
