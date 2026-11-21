import React, { useState } from 'react'
import type { Product, KardexMovementType, KardexReason } from '@shared/contracts'
import { Plus, Minus, X, Check } from '../../../shared/icons/Icons'
import { getProductQuantityStep } from '@shared/lib/product-quantity'
import ProductSearchSelect from './ProductSearchSelect'

interface StockAdjustmentModalProps {
  isOpen: boolean
  mode: 'IN' | 'OUT'
  products: Product[]
  onClose: () => void
  onConfirmAdjustment: (
    productId: string,
    type: KardexMovementType,
    quantity: number,
    reason: KardexReason,
    notes: string
  ) => void
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  mode,
  products,
  onClose,
  onConfirmAdjustment
}) => {
  const [selectedProductIdValue, setSelectedProductId] = useState<string>('')
  const [selectedProductOption, setSelectedProductOption] = useState<Product | null>(null)
  const selectedProductId = products.some((product) => product.id === selectedProductIdValue)
    ? selectedProductIdValue
    : selectedProductOption?.id === selectedProductIdValue
      ? selectedProductIdValue
      : (products[0]?.id ?? '')
  const [quantity, setQuantity] = useState<number>(10)
  const [reason, setReason] = useState<KardexReason>(mode === 'IN' ? 'ENTRADA_MASIVA' : 'MERMA')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ??
    (selectedProductOption?.id === selectedProductId ? selectedProductOption : undefined) ??
    products[0]
  const isInputMode = mode === 'IN'

  const currentStock = selectedProduct?.stock ?? 0
  const exceedsAvailableStock = !isInputMode && quantity > currentStock
  const quantityStep = getProductQuantityStep(selectedProduct?.unit || '')
  const calculatedStock = isInputMode ? currentStock + quantity : currentStock - quantity

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!selectedProduct || quantity <= 0 || exceedsAvailableStock) return

    onConfirmAdjustment(
      selectedProduct.id,
      isInputMode ? 'ENTRADA' : 'SALIDA',
      quantity,
      reason,
      notes
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`shrink-0 w-8 h-8 rounded-[4px] flex items-center justify-center border ${
                isInputMode
                  ? 'bg-emerald-50 text-[#107C41] border-emerald-200'
                  : 'bg-red-50 text-[#C42B1C] border-red-200'
              }`}
            >
              {isInputMode ? <Plus size={18} /> : <Minus size={18} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800">
                {isInputMode
                  ? 'Entradas Masivas de Inventario'
                  : 'Salidas Masivas / Ajuste de Merma'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Afecta directamente el stock y registra trazabilidad en el módulo Kardex
              </p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            {/* Product Select */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Producto a Ajustar</label>
              <ProductSearchSelect
                products={products}
                value={selectedProductId}
                onChange={(id, product) => {
                  setSelectedProductId(id)
                  setSelectedProductOption(product ?? null)
                }}
                label="Producto a ajustar"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
              />
            </div>

            {/* Quantity and Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cantidad ({selectedProduct?.unit || 'Unidades'})
                </label>
                <input
                  type="number"
                  min={quantityStep}
                  max={isInputMode ? undefined : currentStock}
                  step={quantityStep}
                  required
                  autoFocus
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-lg font-bold font-tabular bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
                />
                {exceedsAvailableStock && (
                  <p className="mt-1 text-[11px] text-red-600" role="alert">
                    La salida supera el stock disponible ({currentStock} {selectedProduct?.unit}).
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo del Movimiento
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as KardexReason)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm"
                >
                  {isInputMode ? (
                    <>
                      <option value="ENTRADA_MASIVA">Entrada Masiva / Compra</option>
                      <option value="DEVOLUCION">Devolución de Cliente</option>
                      <option value="INVENTARIO_INICIAL">Ajuste por Conteo Físico</option>
                    </>
                  ) : (
                    <>
                      <option value="MERMA">Merma / Producto Dañado</option>
                      <option value="SALIDA_AJUSTE">Salida por Caducidad</option>
                      <option value="DEVOLUCION">Devolución a Proveedor</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Notes / Document */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Factura, Guía de Remisión o Justificación (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Factura F-8910 / Lote caducado octubre"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm"
              />
            </div>

            {/* Live calculation preview */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded">
              <div>
                <span className="text-slate-400 block text-[11px]">Stock Anterior:</span>
                <span className="font-bold text-slate-700 font-tabular">{currentStock}</span>
              </div>
              <div className="hidden sm:block text-slate-300 text-lg">➔</div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {isInputMode ? 'Ajuste (+):' : 'Ajuste (-):'}
                </span>
                <span
                  className={`font-bold font-tabular ${
                    isInputMode ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {isInputMode ? `+${quantity}` : `-${quantity}`}
                </span>
              </div>
              <div className="hidden sm:block text-slate-300 text-lg">➔</div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nuevo Stock Resultante:</span>
                <span className="font-extrabold text-slate-900 font-tabular text-sm">
                  {calculatedStock} {selectedProduct?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-[#f8f9fa] border-t border-slate-200 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedProduct || quantity <= 0 || exceedsAvailableStock}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                isInputMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Check size={15} />
              <span>Confirmar Ajuste en Kardex</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockAdjustmentModal
