export const SALES_TREND_TOOLTIP_WIDTH = 210
export const SALES_TREND_TOOLTIP_HEIGHT = 88

interface SalesTrendTooltipProps {
  label: string
  sales: string
  profit: string
  x: number
  y: number
}

export function SalesTrendTooltip({
  label,
  sales,
  profit,
  x,
  y
}: SalesTrendTooltipProps): React.JSX.Element {
  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={SALES_TREND_TOOLTIP_WIDTH}
        height={SALES_TREND_TOOLTIP_HEIGHT}
        rx="8"
        fill="#1B1B1B"
        fillOpacity="0.94"
      />
      <text x={x + 12} y={y + 18} fill="#D6E4F0" className="font-mono text-[10px]">
        {label}
      </text>
      <text x={x + 12} y={y + 41} fill="#FFFFFF" className="text-[11px] font-semibold">
        Ventas netas
      </text>
      <text
        x={x + SALES_TREND_TOOLTIP_WIDTH - 12}
        y={y + 41}
        textAnchor="end"
        fill="#FFFFFF"
        className="font-mono text-[11px] font-semibold"
      >
        {sales}
      </text>
      <text x={x + 12} y={y + 66} fill="#A7E5BC" className="text-[11px] font-semibold">
        Utilidad bruta
      </text>
      <text
        x={x + SALES_TREND_TOOLTIP_WIDTH - 12}
        y={y + 66}
        textAnchor="end"
        fill="#A7E5BC"
        className="font-mono text-[11px] font-semibold"
      >
        {profit}
      </text>
    </g>
  )
}
