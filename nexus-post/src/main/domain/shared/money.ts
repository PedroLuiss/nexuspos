/** Utilidades puras de dinero. Sin dependencias de Electron/SQLite. */

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calcMargin(salePrice: number, costPrice: number): { amount: number; percent: number } {
  const amount = roundMoney(salePrice - costPrice)
  const percent = costPrice > 0 ? roundMoney((amount / costPrice) * 100) : 0
  return { amount, percent }
}
