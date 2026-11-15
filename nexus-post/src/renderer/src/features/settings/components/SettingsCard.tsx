import React from 'react'
import { ChevronRight } from '../../../shared/icons/Icons'

export type SettingsAccent = 'blue' | 'green' | 'purple' | 'amber'

export interface SettingsFact {
  label: string
  value: React.ReactNode
  valueClassName?: string
}

interface SettingsCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: SettingsAccent
  badge?: { label: string; className: string }
  description: React.ReactNode
  facts: SettingsFact[]
  footerNote: string
  actionLabel: string
  actionHotkey?: string
  onAction: () => void
  disabled?: boolean
  disabledHint?: string
}

const ACCENTS: Record<
  SettingsAccent,
  { icon: string; button: string }
> = {
  blue: {
    icon: 'bg-[#0067C0]/10 text-[#0067C0] group-hover:bg-[#0067C0] group-hover:text-white',
    button:
      'text-[#0067C0] bg-[#0067C0]/10 hover:bg-[#0067C0] hover:text-white'
  },
  green: {
    icon: 'bg-emerald-50 text-[#107C41] group-hover:bg-[#107C41] group-hover:text-white',
    button: 'text-[#107C41] bg-emerald-50 hover:bg-[#107C41] hover:text-white'
  },
  purple: {
    icon: 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
    button: 'text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white'
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    button: 'text-amber-800 bg-amber-50 hover:bg-amber-600 hover:text-white'
  }
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  icon,
  title,
  subtitle,
  accent,
  badge,
  description,
  facts,
  footerNote,
  actionLabel,
  actionHotkey,
  onAction,
  disabled = false,
  disabledHint
}) => {
  const palette = ACCENTS[accent]

  return (
    <div
      className={`bg-white border rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex flex-col justify-between group transition-all ${
        disabled
          ? 'border-dashed border-[#D1D1D1] opacity-80'
          : 'border-[#E5E5E5] hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[4px] flex items-center justify-center transition-colors ${
                disabled ? 'bg-slate-100 text-slate-400' : palette.icon
              }`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">{title}</h3>
              <p className="text-[11px] text-[#717783]">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        <p className="text-xs text-[#5C5C5C] mb-3 leading-relaxed">{description}</p>

        <div className="bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5] p-3 space-y-1.5 text-xs">
          {facts.map((fact) => (
            <div key={fact.label} className="flex justify-between gap-3 text-[11px]">
              <span className="text-[#5C5C5C] shrink-0">{fact.label}</span>
              <span className={`font-semibold text-[#1B1B1B] truncate ${fact.valueClassName ?? ''}`}>
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E5E5E5] flex justify-between items-center gap-2">
        <span className="text-[11px] text-[#717783]">{disabledHint ?? footerNote}</span>
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          title={disabled ? disabledHint : actionLabel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[4px] transition-colors ${
            disabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : `${palette.button} cursor-pointer`
          }`}
        >
          <span>{actionLabel}</span>
          {actionHotkey && (
            <span className="font-mono text-[10px] bg-white/40 px-1 rounded">{actionHotkey}</span>
          )}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default SettingsCard
