import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  fullWidth?: boolean
  containerClassName?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      fullWidth = true,
      className = '',
      containerClassName = '',
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    const width = fullWidth ? 'w-full' : ''

    return (
      <div className={`flex flex-col gap-1 text-left ${width} ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#1B1B1B] select-none flex items-center gap-1">
            {label}
            {required && <span className="text-[#C42B1C]">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-2.5 text-[#717783] pointer-events-none flex items-center justify-center">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`
              h-8 px-3 text-xs bg-[#F9F9F9] border rounded-sm transition-colors font-sans text-[#1B1B1B] placeholder-[#717783]
              focus:outline-none focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]
              disabled:bg-[#EBEBEB] disabled:text-[#717783] disabled:cursor-not-allowed
              ${error ? 'border-[#C42B1C] focus:border-[#C42B1C] focus:ring-[#C42B1C]' : 'border-[#D1D1D1]'}
              ${icon ? 'pl-8' : ''}
              ${width}
              ${className}
            `}
            {...props}
          />
        </div>

        {error ? (
          <span className="text-[11px] font-medium text-[#C42B1C] tracking-tight">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[#717783] tracking-tight">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

InputField.displayName = 'InputField'
