import { useState } from 'react'
import type { FocusEvent, InputHTMLAttributes, JSX } from 'react'
import { roundMoney } from '@shared/lib/tax'

interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value: number
  onValueChange: (value: number) => void
}

function toCurrency(value: number): number {
  return Number.isFinite(value) ? roundMoney(value) : 0
}

function formatCurrency(value: number): string {
  return toCurrency(value).toFixed(2)
}

export function CurrencyInput({
  value,
  onValueChange,
  onFocus,
  onBlur,
  min,
  max,
  ...inputProps
}: CurrencyInputProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const handleFocus = (event: FocusEvent<HTMLInputElement>): void => {
    setDraft(formatCurrency(value))
    setIsEditing(true)
    onFocus?.(event)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>): void => {
    const parsedValue = Number(draft.replace(',', '.'))
    const minValue = min === undefined ? Number.NEGATIVE_INFINITY : Number(min)
    const maxValue = max === undefined ? Number.POSITIVE_INFINITY : Number(max)
    const boundedValue =
      Number.isFinite(parsedValue) && draft.trim() !== ''
        ? Math.max(minValue, Math.min(maxValue, parsedValue))
        : value
    const normalizedValue = toCurrency(boundedValue)
    onValueChange(normalizedValue)
    setDraft(formatCurrency(normalizedValue))
    setIsEditing(false)
    onBlur?.(event)
  }

  return (
    <input
      {...inputProps}
      min={min}
      max={max}
      type="text"
      inputMode="decimal"
      value={isEditing ? draft : formatCurrency(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(event) => {
        const nextDraft = event.target.value.replace(/[^\d.,-]/g, '')
        setDraft(nextDraft)
        const parsedValue = Number(nextDraft.replace(',', '.'))
        if (nextDraft === '') onValueChange(0)
        else if (Number.isFinite(parsedValue)) onValueChange(toCurrency(parsedValue))
      }}
    />
  )
}
