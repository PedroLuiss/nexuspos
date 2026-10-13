import React, { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'checkout'
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'secondary',
  fullWidth,
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'h-8 px-4 rounded-sm font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none font-sans cursor-pointer'

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 border border-transparent shadow-sm',
    secondary:
      'bg-gray-200 text-[#1B1B1B] hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-400 border border-gray-300 shadow-sm',
    danger:
      'bg-[#C42B1C] text-white hover:bg-[#A82317] active:bg-[#8F1D12] focus:ring-[#C42B1C] border border-transparent shadow-sm',
    checkout:
      'bg-[#107C41] text-white hover:bg-[#0F7B0F] active:bg-[#005228] focus:ring-[#107C41] border border-transparent shadow-sm'
  }

  const width = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        icon && <span className="flex items-center shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  )
}
