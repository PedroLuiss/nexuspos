export function LegendItem({
  label,
  tone
}: {
  label: string
  tone: 'sales' | 'profit'
}): React.JSX.Element {
  const isSales = tone === 'sales'
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#1B1B1B]">
      <span
        className={`w-5 border-t-[3px] ${isSales ? 'rounded-full border-[#0067C0]' : 'border-dashed border-emerald-700'}`}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
