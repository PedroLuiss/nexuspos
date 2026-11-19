import type { InputHTMLAttributes, JSX } from 'react'
import { CurrencyInput } from './CurrencyInput'

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  label?: string
  error?: string
  value: number
  onValueChange: (value: number) => void
}

export function MoneyInput({
  label,
  error,
  className = '',
  ...props
}: MoneyInputProps): JSX.Element {
  return (
    <div className="flex w-full flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-gray-500 sm:text-sm">
          $
        </span>
        <CurrencyInput
          {...props}
          className={`block h-8 w-full rounded-sm border py-1.5 pl-7 pr-3 text-right font-mono text-sm tabular-nums shadow-sm focus:border-[#0067C0] focus:ring-[#0067C0] ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          } ${className}`}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
