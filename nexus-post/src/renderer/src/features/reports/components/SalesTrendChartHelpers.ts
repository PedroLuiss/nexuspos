import type { ReportGrouping } from '@shared/contracts'

export function formatBucket(bucket: string, grouping: ReportGrouping): string {
  if (grouping === 'day') {
    const [year, month, day] = bucket.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short'
    })
  }
  if (grouping === 'week') {
    const [year, week] = bucket.split('-W')
    return `Sem ${week} · ${year}`
  }
  if (grouping === 'month') {
    const [year, month] = bucket.split('-').map(Number)
    return new Date(year, month - 1, 1).toLocaleDateString('es-VE', {
      month: 'short',
      year: '2-digit'
    })
  }
  return bucket
}

export function formatAxisValue(value: number): string {
  const formatted = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 }).format(
    Math.abs(value)
  )
  return value < 0 ? `−$${formatted}` : `$${formatted}`
}
