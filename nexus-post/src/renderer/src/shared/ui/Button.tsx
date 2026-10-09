import React, { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
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
    primary: 'bg-[#0067C0] text-white hover:bg-[#005ba1] focus:ring-[#0067C0]',
    secondary: 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600'
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
