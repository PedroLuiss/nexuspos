import type { KardexPeriod } from '../contracts/inventory.contract'

export function getKardexPeriodRange(
  period: KardexPeriod,
  now: Date = new Date()
): { from?: string; to?: string } {
  if (period === 'ALL') return {}

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let end: Date

  if (period === 'WEEK') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    end = new Date(start)
    end.setDate(end.getDate() + 7)
  } else if (period === 'YEAR') {
    start.setMonth(0, 1)
    end = new Date(start.getFullYear() + 1, 0, 1)
  } else {
    start.setDate(1)
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  }

  return { from: start.toISOString(), to: end.toISOString() }
}
