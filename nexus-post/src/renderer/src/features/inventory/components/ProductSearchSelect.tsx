import React, { useId, useState } from 'react'
import type { Product } from '@shared/contracts'

interface ProductSearchSelectProps {
  products: Product[]
  value: string
  onChange: (productId: string) => void
  label: string
  placeholder?: string
  className?: string
}

const defaultClassName =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

/** Selector de productos con búsqueda por código o nombre. */
export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  products,
  value,
  onChange,
  label,
  placeholder = 'Buscar por código o nombre...',
  className = defaultClassName
}) => {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const selectedProduct = products.find((product) => product.id === value)
  const selectedLabel = selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : ''
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredProducts = products.filter((product) =>
    `${product.code} ${product.name}`.toLocaleLowerCase().includes(normalizedQuery)
  )

  const chooseProduct = (product: Product): void => {
    onChange(product.id)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(0)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      if (filteredProducts.length > 0) {
        setActiveIndex((index) =>
          index < 0 ? 0 : Math.min(index + 1, filteredProducts.length - 1)
        )
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => (index < 0 ? filteredProducts.length - 1 : Math.max(index - 1, 0)))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (!isOpen) {
        setQuery('')
        setIsOpen(true)
      } else if (filteredProducts[activeIndex]) {
        chooseProduct(filteredProducts[activeIndex])
      } else if (filteredProducts.length === 1) {
        chooseProduct(filteredProducts[0])
      }
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      event.stopPropagation()
      setQuery('')
      setIsOpen(false)
    }
  }

  return (
    <div>
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0 && filteredProducts[activeIndex]
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        autoComplete="off"
        value={isOpen ? query : selectedLabel}
        onFocus={() => {
          setQuery('')
          setActiveIndex(-1)
          setIsOpen(true)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(-1)
          setIsOpen(true)
        }}
        onBlur={() => {
          setQuery('')
          setIsOpen(false)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="mt-1 max-h-48 overflow-y-auto border border-slate-200 bg-white rounded-[4px] shadow-md"
        >
          {filteredProducts.length === 0 ? (
            <p className="px-2.5 py-2 text-[11px] text-slate-500">
              {products.length === 0
                ? 'No hay productos disponibles.'
                : 'No se encontraron productos con ese código o nombre.'}
            </p>
          ) : (
            filteredProducts.map((product, index) => (
              <div
                key={product.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={product.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseProduct(product)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-2.5 py-1.5 text-xs ${
                  index === activeIndex ? 'bg-blue-50 text-[#0067C0]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0 truncate font-medium">{product.name}</span>
                <span className="shrink-0 text-[10px] text-slate-500">
                  {product.code} · {product.stock} {product.unit}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ProductSearchSelect
