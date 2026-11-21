import React, { useState, useEffect, useMemo } from 'react'

interface ProductAvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const COLOR_PALETTES = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' }
]

const SIZE_CLASSES = {
  xs: {
    container: 'w-6 h-6 rounded-[3px] text-[10px]',
    icon: 10
  },
  sm: {
    container: 'w-8 h-8 rounded-[4px] text-xs',
    icon: 14
  },
  md: {
    container: 'w-10 h-10 rounded-[6px] text-sm',
    icon: 18
  },
  lg: {
    container: 'w-14 h-14 rounded-[6px] text-xl',
    icon: 24
  }
}

export const ProductAvatar: React.FC<ProductAvatarProps> = ({
  name,
  imageUrl,
  size = 'sm',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false)

  // Si cambia la URL, reiniciar el estado de error
  useEffect(() => {
    setImgError(false)
  }, [imageUrl])

  // Inicial de la primera letra
  const initial = useMemo(() => {
    const trimmed = (name || '').trim()
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?'
  }, [name])

  // Paleta de color determinista basada en el código ASCII del nombre
  const palette = useMemo(() => {
    let hash = 0
    const str = name || 'P'
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    const index = Math.abs(hash) % COLOR_PALETTES.length
    return COLOR_PALETTES[index]
  }, [name])

  const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.sm
  const hasValidImage = Boolean(imageUrl && imageUrl.trim().length > 0 && !imgError)

  if (hasValidImage) {
    return (
      <div
        className={`${sizeCfg.container} border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 select-none shadow-2xs ${className}`}
      >
        <img
          src={imageUrl!}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="eager"
        />
      </div>
    )
  }

  // Fallback: Mostrar la primera letra del producto con estilo logo
  return (
    <div
      className={`${sizeCfg.container} ${palette.bg} ${palette.text} ${palette.border} border font-bold flex items-center justify-center overflow-hidden flex-shrink-0 select-none shadow-2xs ${className}`}
      title={name}
    >
      <span className="leading-none">{initial}</span>
    </div>
  )
}

export default ProductAvatar
