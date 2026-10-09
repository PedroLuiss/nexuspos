import React, { useState } from 'react'
import { Product, KardexMovementType, KardexReason } from '../../../shared/types/domain'
import { Plus, Minus, X, Check, Package, AlertCircle } from '../../../shared/icons/Icons'

interface StockAdjustmentModalProps {
  isOpen: boolean
  mode: 'IN' | 'OUT'
  products: Product[]
  onClose: () => void
  onConfirmAdjustment: (productId: string, quantity: number, reason: KardexReason, notes: string) => void
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  mode,
  products,
  onClose,
  onConfirmAdjustment
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '')
  const [quantity, setQuantity] = useState<number>(10)
  const [reason, setReason] = useState<KardexReason>(
    mode === 'IN' ? 'ENTRADA_MASIVA' : 'MERMA'
  )
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0]
  const isInputMode = mode === 'IN'

  const currentStock = selectedProduct?.stock || 0
  const calculatedStock = isInputMode
    ? currentStock + quantity
    : Math.max(0, currentStock - quantity)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!selectedProduct || quantity <= 0) return

    onConfirmAdjustment(selectedProduct.id, quantity, reason, notes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-lg bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-[4px] flex items-center justify-center border ${
                isInputMode
                  ? 'bg-emerald-50 text-[#107C41] border-emerald-200'
                  : 'bg-red-50 text-[#C42B1C] border-red-200'
              }`}
            >
              {isInputMode ? <Plus size={18} /> : <Minus size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {isInputMode ? 'Entradas Masivas de Inventario' : 'Salidas Masivas / Ajuste de Merma'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Afecta directamente el stock y registra trazabilidad en el módulo Kardex
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-xs">
            {/* Product Select */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Producto a Ajustar
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock actual: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Reason */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cantidad ({selectedProduct?.unit || 'Unidades'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-lg font-bold font-tabular bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
                />
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
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Stock Anterior:</span>
                <span className="font-bold text-slate-700 font-tabular">{currentStock}</span>
              </div>
              <div className="text-slate-300 text-lg">➔</div>
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
              <div className="text-slate-300 text-lg">➔</div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nuevo Stock Resultante:</span>
                <span className="font-extrabold text-slate-900 font-tabular text-sm">
                  {calculatedStock} {selectedProduct?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-[#f8f9fa] border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-sm ${
                isInputMode
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
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
