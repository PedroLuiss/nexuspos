import React, { useState } from 'react'
import { ReportKPI, SalesChartPoint } from '../../shared/types/domain'
import {
  TrendingUp,
  DollarSign,
  Receipt,
  ShoppingCart,
  ArrowUpRight
} from '../../shared/icons/Icons'

const DEFAULT_KPIS: ReportKPI = {
  totalSales: 42850.5,
  netProfit: 13420.25,
  averageTicket: 185.5,
  totalTransactions: 231,
  growthPercent: 14.8
}

const MOCK_CHART_DATA: SalesChartPoint[] = [
  { label: 'Lun', date: '02 Oct', sales: 4800, profit: 1520, ticketCount: 28 },
  { label: 'Mar', date: '03 Oct', sales: 5650, profit: 1840, ticketCount: 34 },
  { label: 'Mié', date: '04 Oct', sales: 6100, profit: 1950, ticketCount: 37 },
  { label: 'Jue', date: '05 Oct', sales: 5200, profit: 1610, ticketCount: 29 },
  { label: 'Vie', date: '06 Oct', sales: 8400, profit: 2750, ticketCount: 46 },
  { label: 'Sáb', date: '07 Oct', sales: 9200, profit: 3010, ticketCount: 52 },
  { label: 'Dom', date: '08 Oct', sales: 3500, profit: 1140, ticketCount: 21 }
]

const TOP_PRODUCTS = [
  { name: 'Refresco Coca-Cola 600ml', code: '7501055300075', units: 142, revenue: 2556.0 },
  { name: 'Leche Entera Alpura 1L', code: '7501020512341', units: 98, revenue: 2646.0 },
  { name: 'Pan Blanco Bimbo Grande', code: '7501000111209', units: 64, revenue: 2880.0 },
  { name: 'Papas Sabritas Clásicas 45g', code: '7501011122334', units: 85, revenue: 1785.0 },
  { name: 'Detergente Ariel 1Kg', code: '7501006543210', units: 36, revenue: 1512.0 }
]

export const ReportsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')
  const [hoveredPoint, setHoveredPoint] = useState<SalesChartPoint | null>(null)

  // Chart SVG calculation
  const maxSale = Math.max(...MOCK_CHART_DATA.map((d) => d.sales)) * 1.15
  const svgWidth = 680
  const svgHeight = 220
  const paddingX = 40
  const paddingY = 30

  // Points mapped to SVG space
  const chartPoints = MOCK_CHART_DATA.map((d, index) => {
    const x = paddingX + (index * (svgWidth - 2 * paddingX)) / (MOCK_CHART_DATA.length - 1)
    const y = svgHeight - paddingY - (d.sales / maxSale) * (svgHeight - 2 * paddingY)
    return { ...d, x, y }
  })

  // SVG Path definition
  const pathD = chartPoints.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  }, '')

  // Closed area path for gradient
  const areaD = `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${
    svgHeight - paddingY
  } L ${chartPoints[0].x} ${svgHeight - paddingY} Z`

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto bg-[#F3F3F3]">
      {/* Top Controls Toolbar (Fluent Box) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">Panel de Rendimiento y Reportes</h2>
          <p className="text-xs text-[#5C5C5C] mt-0.5">
            Métricas de ventas, margen de ganancia y rotación de inventario
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F3F3F3] p-0.5 rounded-[4px] border border-[#E5E5E5] text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-white text-[#0067C0] shadow-xs'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                timeRange === 'week'
                  ? 'bg-white text-[#0067C0] shadow-xs'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                timeRange === 'month'
                  ? 'bg-white text-[#0067C0] shadow-xs'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
              }`}
            >
              Este Mes
            </button>
          </div>
        </div>
      </div>

      {/* Top Summary Table / KPI Cards (Fluent POS Engine Layer 100) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Ventas Totales */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
              Ventas Totales
            </span>
            <div className="w-7 h-7 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B1B1B] mt-1.5">
            ${DEFAULT_KPIS.totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#107C41] mt-1 font-semibold">
            <ArrowUpRight size={14} />
            <span>+{DEFAULT_KPIS.growthPercent}% vs período anterior</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0067C0]"></div>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
              Ganancia Neta
            </span>
            <div className="w-7 h-7 rounded-[4px] bg-emerald-50 text-[#107C41] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#107C41] mt-1.5">
            ${DEFAULT_KPIS.netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#5C5C5C] mt-1">
            Margen de utilidad promedio: <strong className="text-[#1B1B1B]">31.3%</strong>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#107C41]"></div>
        </div>

        {/* Promedio Ticket */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
              Promedio por Ticket
            </span>
            <div className="w-7 h-7 rounded-[4px] bg-purple-50 text-purple-700 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B1B1B] mt-1.5">
            ${DEFAULT_KPIS.averageTicket.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#5C5C5C] mt-1">
            Ticket promedio del cajero
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
        </div>

        {/* Transacciones */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
              Tickets Emitidos
            </span>
            <div className="w-7 h-7 rounded-[4px] bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B1B1B] mt-1.5">
            {DEFAULT_KPIS.totalTransactions}
          </div>
          <div className="text-[11px] text-[#5C5C5C] mt-1">
            Operaciones completadas en caja
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
        </div>
      </div>

      {/* Main Grid: Interactive Sales Curve & Top Products Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* Sales Chart Panel (8 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2 mb-2">
            <div>
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Curva de Ingresos Diarios
              </h3>
              <p className="text-[11px] text-[#5C5C5C]">
                Pasa el cursor sobre los nodos para ver el desglose diario
              </p>
            </div>
            {hoveredPoint && (
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#0067C0]">
                  ${hoveredPoint.sales.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#717783] block">
                  {hoveredPoint.date} • {hoveredPoint.ticketCount} tickets
                </span>
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto py-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="fluentBlueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0067C0" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0067C0" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (svgHeight - 2 * paddingY)
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#E5E5E5"
                    strokeDasharray="3 3"
                  />
                )
              })}

              {/* Gradient Area Fill */}
              <path d={areaD} fill="url(#fluentBlueGradient)" />

              {/* Trend Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#0067C0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Nodes */}
              {chartPoints.map((point) => {
                const isHovered = hoveredPoint?.label === point.label
                return (
                  <g key={point.label}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#0067C0' : '#FFFFFF'}
                      stroke="#0067C0"
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(point)}
                    />
                    <text
                      x={point.x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className="text-[10px] fill-[#717783] font-semibold"
                    >
                      {point.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] text-[11px] text-[#5C5C5C]">
            <span>Período: Últimos 7 días naturales</span>
            <span className="font-semibold text-[#107C41]">Ventas totales semanales en orden ascendente</span>
          </div>
        </div>

        {/* Top Selling Products (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E5E5E5] pb-2 mb-3">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Top 5 Artículos Más Vendidos
              </h3>
              <p className="text-[11px] text-[#5C5C5C]">Por volumen de unidades facturadas</p>
            </div>

            <div className="space-y-2.5">
              {TOP_PRODUCTS.map((prod, index) => (
                <div
                  key={prod.code}
                  className="p-2 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center font-bold text-xs font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-[#1B1B1B] max-w-[170px] truncate">
                        {prod.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#717783]">{prod.code}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-[#1B1B1B]">
                      {prod.units} pzas
                    </span>
                    <span className="block text-[10px] font-mono text-[#107C41] font-semibold">
                      ${prod.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] text-[11px] text-[#717783] text-center">
            Ranking actualizado en tiempo real conforme a las ventas registradas
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsView
