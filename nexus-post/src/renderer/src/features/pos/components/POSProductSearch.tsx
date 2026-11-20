import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { Product } from '@shared/contracts'
import ProductAvatar from '../../../shared/ui/ProductAvatar'
import { Search } from '../../../shared/icons/Icons'
import { usePosProductSearch } from '../hooks/usePosProductSearch'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { formatCurrency } from '../../../shared/lib/currency'

export interface POSProductSearchHandle {
  focusSearch: () => void
  toggleList: () => void
  closeResults: () => void
  refresh: () => void
}

interface POSProductSearchProps {
  showResults: boolean
  onResultsVisibilityChange: (show: boolean) => void
  onAddToCart: (product: Product, quantity?: number) => void
}

const isOutOfStock = (product: Product): boolean =>
  product.trackStock !== false && product.stock <= 0

const SearchSkeletons: React.FC<{ count: number }> = ({ count }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} aria-hidden="true" className="flex items-center gap-3 p-2.5 animate-pulse">
        <div className="h-8 w-8 rounded bg-[#E5E5E5]" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-1/3 rounded bg-[#E5E5E5]" />
          <div className="h-2 w-1/2 rounded bg-[#F0F0F0]" />
        </div>
        <div className="h-3 w-12 rounded bg-[#E5E5E5]" />
      </div>
    ))}
  </>
)

const POSProductSearch = forwardRef<POSProductSearchHandle, POSProductSearchProps>(
  function POSProductSearch({ showResults, onResultsVisibilityChange, onAddToCart }, ref) {
    const [searchInput, setSearchInput] = useState('')
    const { config } = useBusinessConfig()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const {
      products,
      total,
      hasMore,
      isLoading,
      isLoadingMore,
      error,
      loadMore,
      searchNow,
      refresh
    } = usePosProductSearch(searchInput, showResults)

    useImperativeHandle(
      ref,
      () => ({
        focusSearch: () => {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        },
        toggleList: () => onResultsVisibilityChange(!showResults),
        closeResults: () => onResultsVisibilityChange(false),
        refresh: () => {
          if (showResults) refresh()
        }
      }),
      [onResultsVisibilityChange, refresh, showResults]
    )

    const selectProduct = (product: Product): void => {
      if (isOutOfStock(product)) return
      onAddToCart(product, 1)
      setSearchInput('')
      onResultsVisibilityChange(false)
    }

    const handleSearchKeyDown = async (
      event: React.KeyboardEvent<HTMLInputElement>
    ): Promise<void> => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      const query = searchInput.trim()
      if (!query) return

      const matches = await searchNow(query)
      const product =
        matches.find((item) => item.code.trim().toLowerCase() === query.toLowerCase()) ?? matches[0]
      if (!product || isOutOfStock(product)) {
        onResultsVisibilityChange(true)
        return
      }
      selectProduct(product)
    }

    return (
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]" />
        <input
          ref={searchInputRef}
          type="text"
          autoFocus
          placeholder="Escanear código de barras o buscar producto [F2]..."
          value={searchInput}
          onChange={(event) => {
            const value = event.target.value
            setSearchInput(value)
            onResultsVisibilityChange(Boolean(value.trim()))
          }}
          onKeyDown={(event) => void handleSearchKeyDown(event)}
          className="w-full pl-9 pr-24 py-2 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] font-medium text-[#1B1B1B] placeholder:text-[#717783]"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 kbd-badge">ENTER</span>

        {showResults && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-[#D1D1D1] rounded-[4px] shadow-lg max-h-80 overflow-y-auto divide-y divide-[#E5E5E5]">
            {isLoading ? (
              <SearchSkeletons count={5} />
            ) : error ? (
              <div role="alert" className="p-3 text-xs text-[#C42B1C]">
                No se pudo cargar el catálogo: {error}
              </div>
            ) : products.length === 0 ? (
              <div className="p-3 text-xs text-[#717783]">
                {searchInput.trim()
                  ? 'No se encontraron productos por nombre o código.'
                  : 'No hay productos activos para mostrar.'}
              </div>
            ) : (
              <>
                {products.map((product) => {
                  const outOfStock = isOutOfStock(product)
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={outOfStock}
                      title={
                        outOfStock
                          ? 'Producto sin stock; no se puede agregar al carrito'
                          : 'Agregar al carrito'
                      }
                      onClick={() => selectProduct(product)}
                      className={`flex w-full items-center justify-between gap-3 border-l-2 p-2.5 text-left transition-colors ${
                        outOfStock
                          ? 'cursor-not-allowed border-l-red-300 bg-red-50'
                          : 'cursor-pointer border-l-transparent hover:bg-[#EBF0F5]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ProductAvatar name={product.name} imageUrl={product.imageUrl} size="xs" />
                        <span className="shrink-0 font-mono text-xs text-[#5C5C5C] bg-[#F3F3F3] px-1.5 py-0.5 rounded-[2px] border border-[#E5E5E5]">
                          {product.code}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-xs text-[#1B1B1B]">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-[#717783]">{product.category}</div>
                          <div
                            className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              outOfStock
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {product.trackStock === false ? 'Servicio' : `Stock: ${product.stock}`}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-bold font-mono text-[#0067C0]">
                          {formatCurrency(product.salePrice, config.currency)}
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${outOfStock ? 'text-[#C42B1C]' : 'text-emerald-700'}`}
                        >
                          {outOfStock ? 'Sin existencias' : 'Click para agregar'}
                        </span>
                      </div>
                    </button>
                  )
                })}
                {isLoadingMore && <SearchSkeletons count={3} />}
              </>
            )}
            {hasMore && !isLoading && !error && (
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full px-3 py-2 text-xs font-semibold text-[#0067C0] hover:bg-[#F3F7FB] disabled:opacity-60"
              >
                {isLoadingMore ? 'Cargando...' : `Cargar 50 más (${products.length} de ${total})`}
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)

POSProductSearch.displayName = 'POSProductSearch'

export default POSProductSearch
