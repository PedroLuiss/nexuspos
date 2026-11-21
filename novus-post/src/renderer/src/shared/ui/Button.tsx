import React, { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'checkout'
  fullWidth?: boolean
}

export function Button({ 
  variant = 'secondary', 
  fullWidth, 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'h-8 px-4 rounded-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm'
  
  const variants = {
    primary: 'bg-[#0067C0] text-white hover:bg-[#0078D4] active:bg-[#005A9E] focus:ring-[#0067C0]',
    secondary: 'bg-white border border-[#D1D1D1] text-[#1B1B1B] hover:bg-[#F9F9F9] focus:ring-[#D1D1D1]',
    danger: 'bg-[#C42B1C] text-white hover:bg-[#A82317] focus:ring-[#C42B1C]',
    checkout: 'bg-[#107C41] text-white hover:bg-[#0F7B0F] active:bg-[#005228] focus:ring-[#107C41]'
  }

  const width = fullWidth ? 'w-full' : ''

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
