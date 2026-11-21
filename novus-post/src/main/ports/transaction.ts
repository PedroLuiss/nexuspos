/**
 * Puerto de control transaccional.
 * Permite agrupar varias escrituras de repositorio de forma atómica.
 */
export interface TransactionRunner {
  run<T>(work: () => T): T
}
