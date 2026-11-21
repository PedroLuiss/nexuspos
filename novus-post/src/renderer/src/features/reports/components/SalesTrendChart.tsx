import { useState } from 'react'
import type {
  CurrencyCode,
  CurrencyVesExchangeRate,
  ReportGrouping,
  ReportSeriesPoint
} from '@shared/contracts'
import { ChartNoAxesCombined } from '../../../shared/icons/Icons'
import { ReportMoney } from './ReportMoney'
import { formatAxisValue, formatBucket } from './SalesTrendChartHelpers'
import { LegendItem } from './SalesTrendChartLegend'
import {
  SalesTrendTooltip,
  SALES_TREND_TOOLTIP_HEIGHT,
  SALES_TREND_TOOLTIP_WIDTH
} from './SalesTrendTooltip'

interface SalesTrendChartProps {
  points: ReportSeriesPoint[]
  grouping: ReportGrouping
  isLoading: boolean
  rate: CurrencyVesExchangeRate | null
  currency: CurrencyCode
}

export function SalesTrendChart({
  points,
  grouping,
  isLoading,
  rate,
  currency
}: SalesTrendChartProps): React.JSX.Element {
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null)
  const width = Math.max(760, points.length * 72)
  const height = 320
  const paddingX = 76
  const paddingY = 30
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
    return { ...point, x, y, profitY, label: formatBucket(point.bucket, grouping), index }
  })
  const selectedPoint =
    chartPoints.find((point) => point.bucket === hoveredBucket) ??
    chartPoints[chartPoints.length - 1]
  const labelStep = Math.max(1, Math.ceil(chartPoints.length / 12))
  const line = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const profitLine = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.profitY}`)
    .join(' ')
  const area = chartPoints.length
    ? `${line} L ${chartPoints[chartPoints.length - 1].x} ${zeroY} L ${chartPoints[0].x} ${zeroY} Z`
    : ''
  const tooltipWidth = SALES_TREND_TOOLTIP_WIDTH
  const tooltipHeight = SALES_TREND_TOOLTIP_HEIGHT
  const tooltipX = selectedPoint
    ? selectedPoint.x + tooltipWidth + 18 > width - paddingX
      ? selectedPoint.x - tooltipWidth - 14
      : selectedPoint.x + 14
    : 0
  const tooltipY = selectedPoint
    ? Math.max(
        paddingY + 4,
        Math.min(height - paddingY - tooltipHeight, selectedPoint.y - tooltipHeight - 14)
      )
    : 0

  return (
    <section className="shrink-0 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E5E5] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-[#0067C0]/10 p-2 text-[#0067C0]">
            <ChartNoAxesCombined size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#0067C0]">
              Análisis de tendencia
            </p>
            <h3 className="mt-0.5 text-sm font-bold text-[#1B1B1B]">Ventas y rentabilidad</h3>
            <p className="mt-1 text-[11px] text-[#5C5C5C]">
              Evolución de ventas netas y utilidad bruta por período
            </p>
          </div>
        </div>
        {selectedPoint && (
          <div className="min-w-[220px] rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#717783]">
                Detalle del período
              </span>
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#5C5C5C]">
                {selectedPoint.label}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[9px] font-semibold text-[#5C5C5C]">Ventas netas</span>
                <ReportMoney amount={selectedPoint.totalSales} rate={rate} currency={currency} />
              </div>
              <div>
                <span className="block text-[9px] font-semibold text-emerald-700">
                  Utilidad bruta
                </span>
                <ReportMoney amount={selectedPoint.grossProfit} rate={rate} currency={currency} />
              </div>
            </div>
            <p className="mt-1.5 text-right text-[9px] text-[#717783]">
              {selectedPoint.ticketCount.toLocaleString('es-VE')} facturas
            </p>
          </div>
        )}
      </header>
      {points.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span className="rounded-full bg-slate-100 p-3 text-slate-500">
            <ChartNoAxesCombined size={20} aria-hidden="true" />
          </span>
          <p className="mt-3 text-xs font-semibold text-[#1B1B1B]">No hay ventas para mostrar</p>
          <p className="mt-1 text-[11px] text-[#717783]">
            Prueba con otro período o rango de fechas.
          </p>
        </div>
      ) : (
        <div className="px-3 pb-2 pt-3 sm:px-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <LegendItem label="Ventas netas" tone="sales" />
              <LegendItem label="Utilidad bruta" tone="profit" />
            </div>
            <span className="rounded-md bg-[#F3F3F3] px-2 py-1 font-mono text-[10px] font-semibold text-[#5C5C5C]">
              {points.length.toLocaleString('es-VE')} períodos
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg bg-[#FAFBFD]">
            <svg
              role="img"
              aria-label={`Gráfico interactivo de ventas netas y utilidad bruta por período, con valores en ${currency}`}
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="block h-[320px] select-none"
              style={{ width: `${width}px`, minWidth: `${width}px` }}
              onMouseLeave={() => setHoveredBucket(null)}
            >
              <defs>
                <linearGradient id="reportSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0067C0" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0067C0" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + ratio * (height - 2 * paddingY)
                const value = maxValue - ratio * chartRange
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="#DDE3EA"
                      strokeDasharray="4 5"
                    />
                    <text
                      x={paddingX - 12}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-[#717783] font-mono text-[10px]"
                    >
                      {formatAxisValue(value, currency)}
                    </text>
                  </g>
                )
              })}
              <line
                x1={paddingX}
                y1={zeroY}
                x2={width - paddingX}
                y2={zeroY}
                stroke="#8A96A3"
                strokeWidth="1.25"
              />
              <path d={area} fill="url(#reportSalesGradient)" />
              <path
                d={line}
                fill="none"
                stroke="#0067C0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={profitLine}
                fill="none"
                stroke="#107C41"
                strokeWidth="2.5"
                strokeDasharray="7 5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartPoints.map((point) => {
                const isSelected = selectedPoint?.bucket === point.bucket
                const shouldShowLabel =
                  point.index % labelStep === 0 || point.index === chartPoints.length - 1
                return (
                  <g
                    key={point.bucket}
                    onMouseEnter={() => setHoveredBucket(point.bucket)}
                    onFocus={() => setHoveredBucket(point.bucket)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${point.label}: ventas netas ${formatAxisValue(point.totalSales, currency)}, utilidad bruta ${formatAxisValue(point.grossProfit, currency)}, ${point.ticketCount} facturas`}
                  >
                    {isSelected && (
                      <line
                        x1={point.x}
                        y1={paddingY}
                        x2={point.x}
                        y2={height - paddingY}
                        stroke="#AAB5C2"
                        strokeDasharray="3 4"
                      />
                    )}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isSelected ? 7 : 4.5}
                      fill="white"
                      stroke="#0067C0"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={point.x}
                      cy={point.profitY}
                      r={isSelected ? 5 : 3.5}
                      fill="#107C41"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    {shouldShowLabel && (
                      <text
                        x={point.x}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-[#5C5C5C] font-mono text-[10px]"
                      >
                        {point.label}
                      </text>
                    )}
                  </g>
                )
              })}
              {selectedPoint && (
                <SalesTrendTooltip
                  label={`${selectedPoint.label} · ${selectedPoint.ticketCount} facturas`}
                  sales={formatAxisValue(selectedPoint.totalSales, currency)}
                  profit={formatAxisValue(selectedPoint.grossProfit, currency)}
                  x={tooltipX}
                  y={tooltipY}
                />
              )}
            </svg>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5] py-2 text-[10px] text-[#717783]">
            <span>
              Valores monetarios en {currency}
              {currency === 'VES' ? '' : ' · conversión VES informativa en el detalle'}
            </span>
            <span>Pasa el cursor o usa el teclado sobre un punto para ver el detalle</span>
          </div>
        </div>
      )}
      {isLoading && points.length > 0 && (
        <div className="border-t border-blue-100 bg-blue-50 px-5 py-2 text-[10px] font-medium text-blue-800">
          Actualizando la tendencia con los filtros seleccionados…
        </div>
      )}
    </section>
  )
}
