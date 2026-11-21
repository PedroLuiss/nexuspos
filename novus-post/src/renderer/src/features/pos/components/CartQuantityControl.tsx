import { useState } from 'react'
import type { Product } from '@shared/contracts'
import {
  formatProductQuantity,
  getProductQuantityStep,
  isFractionalQuantityUnit,
  isValidProductQuantity
} from '@shared/lib/product-quantity'
import { Minus, Plus } from '../../../shared/icons/Icons'

interface CartQuantityControlProps {
  product: Product
  quantity: number
  onUpdate: (quantity: number) => void
}

export function CartQuantityControl({
  product,
  quantity,
  onUpdate
}: CartQuantityControlProps): React.JSX.Element {
  const [draft, setDraft] = useState<string | null>(null)
  const fractional = isFractionalQuantityUnit(product.unit)
  const step = getProductQuantityStep(product.unit)
  const minimum = fractional ? 0.001 : 1
  const draftQuantity = draft === null ? quantity : Number(draft)
  const draftIsValid = isValidProductQuantity(draftQuantity, product.unit)

  const changeQuantity = (nextQuantity: number): void => {
    const normalized = fractional ? Math.round(nextQuantity * 1000) / 1000 : nextQuantity
    onUpdate(normalized)
    setDraft(null)
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="inline-flex items-center overflow-hidden rounded-[2px] border border-[#D1D1D1] bg-white shadow-xs">
        <button
          type="button"
          aria-label={`Disminuir cantidad de ${product.name}`}
          disabled={quantity <= minimum}
          onClick={(event) => {
            event.stopPropagation()
            changeQuantity(Math.max(minimum, quantity - Number(step)))
          }}
          className="cursor-pointer px-2 py-0.5 text-[#5C5C5C] transition-colors hover:bg-[#F3F3F3] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={11} />
        </button>
        <input
          type="number"
          inputMode="decimal"
          min={minimum}
          step={step}
          value={draft ?? String(quantity)}
          aria-label={`Cantidad en ${product.unit}`}
          aria-invalid={draft !== null && !draftIsValid}
          title={
            fractional
              ? `Ingrese una cantidad en ${product.unit} con hasta 3 decimales`
              : 'Este producto se vende en cantidades enteras'
          }
          onClick={(event) => event.stopPropagation()}
          onFocus={() => setDraft(String(quantity))}
          onChange={(event) => {
            const value = event.target.value
            setDraft(value)
            const nextQuantity = Number(value)
            if (isValidProductQuantity(nextQuantity, product.unit)) onUpdate(nextQuantity)
          }}
          onBlur={() => {
            if (draft !== null && draftIsValid) onUpdate(draftQuantity)
            setDraft(null)
          }}
          className={`w-14 border-x border-[#E5E5E5] py-0.5 text-center font-mono text-xs font-bold text-[#1B1B1B] ${
            draft !== null && !draftIsValid ? 'bg-red-50' : ''
          }`}
        />
        <button
          type="button"
          aria-label={`Aumentar cantidad de ${product.name}`}
          onClick={(event) => {
            event.stopPropagation()
            changeQuantity(quantity + Number(step))
          }}
          className="cursor-pointer px-2 py-0.5 text-[#5C5C5C] transition-colors hover:bg-[#F3F3F3]"
        >
          <Plus size={11} />
        </button>
      </div>
      <span className="max-w-24 truncate text-[9px] text-[#717783]" title={product.unit}>
        {product.unit} · {formatProductQuantity(quantity)}
      </span>
    </div>
  )
}
