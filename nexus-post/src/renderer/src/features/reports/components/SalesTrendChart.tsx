import { useState } from 'react'
import type { ReportGrouping, ReportSeriesPoint, UsdVesExchangeRate } from '@shared/contracts'
import { ReportMoney } from './ReportMoney'

interface SalesTrendChartProps {
  points: ReportSeriesPoint[]
  grouping: ReportGrouping
  isLoading: boolean
  rate: UsdVesExchangeRate | null
}

function formatBucket(bucket: string, grouping: ReportGrouping): string {
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

export function SalesTrendChart({
  points,
  grouping,
  isLoading,
  rate
}: SalesTrendChartProps): React.JSX.Element {
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null)
  const width = Math.max(680, points.length * 52)
  const height = 250
  const paddingX = 44
  const paddingY = 28
  const values = points.flatMap((point) => [point.totalSales, point.grossProfit])
  const minValue = Math.min(0, ...values)
  const maxValue = Math.max(1, ...values) * 1.15
  const chartRange = maxValue - minValue
  const zeroY = height - paddingY - ((0 - minValue) / chartRange) * (height - 2 * paddingY)
  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : paddingX + (index * (width - 2 * paddingX)) / (points.length - 1)
    const scale = height - 2 * paddingY
    const y = height - paddingY - ((point.totalSales - minValue) / chartRange) * scale
    const profitY = height - paddingY - ((point.grossProfit - minValue) / chartRange) * scale
    return { ...point, x, y, profitY, label: formatBucket(point.bucket, grouping) }
  })
  const selectedPoint = chartPoints.find((point) => point.bucket === hoveredBucket)
  const line = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const profitLine = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.profitY}`)
    .join(' ')
  const area = chartPoints.length
    ? `${line} L ${chartPoints[chartPoints.length - 1].x} ${zeroY} L ${chartPoints[0].x} ${zeroY} Z`
    : ''

  return (
    <section className="rounded border border-[#E5E5E5] bg-white p-4">
      <header className="mb-2 flex min-h-12 items-start justify-between gap-3 border-b border-[#E5E5E5] pb-2">
        <div>
          <h3 className="text-xs font-bold uppercase">Tendencia de ventas</h3>
          <p className="text-[11px] text-[#5C5C5C]">
            {isLoading ? 'Actualizando datos reales…' : 'Ventas netas y utilidad bruta por período'}
          </p>
        </div>
        {selectedPoint && (
          <div className="text-right text-xs">
            <ReportMoney amount={selectedPoint.totalSales} rate={rate} />
            <span className="block text-[10px] text-[#5C5C5C]">
              {selectedPoint.label} · {selectedPoint.ticketCount} facturas
            </span>
            <span className="text-[10px] text-emerald-700">Utilidad</span>
            <ReportMoney amount={selectedPoint.grossProfit} rate={rate} />
          </div>
        )}
      </header>
      {points.length === 0 ? (
        <p className="py-16 text-center text-xs text-[#717783]">
          No hay ventas para mostrar en este período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label="Gráfico de ventas y utilidad bruta por período"
            viewBox={`0 0 ${width} ${height}`}
            className="h-64 min-w-full select-none"
            style={{ minWidth: `${width}px` }}
          >
            <defs>
              <linearGradient id="reportSalesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0067C0" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0067C0" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + ratio * (height - 2 * paddingY)
              return (
                <line
                  key={ratio}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E5E5E5"
                  strokeDasharray="3 3"
                />
              )
            })}
            <line
              x1={paddingX}
              y1={zeroY}
              x2={width - paddingX}
              y2={zeroY}
              stroke="#A0A0A0"
              strokeWidth="1"
            />
            <path d={area} fill="url(#reportSalesGradient)" />
            <path
              d={line}
              fill="none"
              stroke="#0067C0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={profitLine}
              fill="none"
              stroke="#107C41"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chartPoints.map((point) => (
              <g
                key={point.bucket}
                onMouseEnter={() => setHoveredBucket(point.bucket)}
                onFocus={() => setHoveredBucket(point.bucket)}
                tabIndex={0}
                role="button"
                aria-label={`${point.label}: $${point.totalSales.toFixed(2)}, ${point.ticketCount} facturas`}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredBucket === point.bucket ? 6 : 4}
                  fill="white"
                  stroke="#0067C0"
                  strokeWidth="2"
                />
                <circle cx={point.x} cy={point.profitY} r="3" fill="#107C41" />
                <text
                  x={point.x}
                  y={height - 7}
                  textAnchor="middle"
                  className="fill-[#717783] text-[10px]"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
      <footer className="flex items-center gap-4 border-t border-[#E5E5E5] pt-2 text-[10px] text-[#5C5C5C]">
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-[#0067C0]" /> Ventas netas
        </span>
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-emerald-600" /> Utilidad bruta
        </span>
      </footer>
    </section>
  )
}
