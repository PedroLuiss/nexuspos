import React, { InputHTMLAttributes } from 'react'

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export function MoneyInput({ 
  label, 
  error, 
  className = '', 
  ...props 
}: MoneyInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm font-mono">$</span>
        </div>
        <input
          type="number"
          step="0.01"
          className={`block w-full pl-7 pr-3 py-1.5 h-8 text-right font-mono tabular-nums text-sm border rounded-sm shadow-sm focus:ring-[#0067C0] focus:border-[#0067C0] ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
