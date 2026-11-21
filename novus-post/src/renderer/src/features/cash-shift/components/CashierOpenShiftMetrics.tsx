import { Banknote } from '../../../shared/icons/Icons'

export function SummaryCard({
  label,
  value,
  detail,
  tone
}: {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'slate'
}): React.JSX.Element {
  const iconTone =
    tone === 'blue'
      ? 'bg-blue-50 text-[#0067C0]'
      : tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-slate-100 text-slate-600'

  return (
    <article className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 font-mono text-xl font-bold tabular-nums text-slate-900">{value}</p>
        <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
      </div>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTone}`}>
        <Banknote size={17} />
      </span>
    </article>
  )
}

export function DetailValue({
  label,
  value,
  emphasized = false
}: {
  label: string
  value: string
  emphasized?: boolean
}): React.JSX.Element {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 truncate font-mono text-xs font-bold tabular-nums ${
          emphasized ? 'text-[#005A9E]' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
