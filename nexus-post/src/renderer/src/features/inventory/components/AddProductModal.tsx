import React, { useState } from 'react'
import { Product } from '../../../shared/types/domain'
import { Package, X, Check, Barcode, DollarSign } from '../../../shared/icons/Icons'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Omit<Product, 'id'>) => void
  initialData?: Product | null
}

const CATEGORIES = [
  'Bebidas y Refrescos',
  'Alimentos y Abarrotes',
  'Lácteos y Quesos',
  'Limpieza y Hogar',
  'Snacks y Golosinas',
  'Cuidado Personal',
  'Farmacia y Salud'
]

const UNITS = ['Pieza (pza)', 'Kilogramo (kg)', 'Litro (lt)', 'Caja (caja)', 'Paquete (paq)']

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [code, setCode] = useState(initialData?.code || '')
  const [name, setName] = useState(initialData?.name || '')
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0])
  const [unit, setUnit] = useState(initialData?.unit || 'Pieza (pza)')
  const [description, setDescription] = useState(initialData?.description || '')

  const [costPrice, setCostPrice] = useState<number>(initialData?.costPrice || 0)
  const [salePrice, setSalePrice] = useState<number>(initialData?.salePrice || 0)
  const [stock, setStock] = useState<number>(initialData?.stock || 0)
  const [minStock, setMinStock] = useState<number>(initialData?.minStock || 5)
  const [hasTax, setHasTax] = useState<boolean>(initialData?.hasTax ?? true)
  const [active, setActive] = useState<boolean>(initialData?.active ?? true)

  if (!isOpen) return null

  // Calculate live profit margin
  const marginDollar = salePrice - costPrice
  const marginPercent = costPrice > 0 ? ((marginDollar / costPrice) * 100).toFixed(1) : '0'

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim() || !code.trim() || salePrice <= 0) return

    onSave({
      code: code.trim(),
      name: name.trim(),
      category,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      unit,
      hasTax,
      active,
      description: description.trim()
    })
    onClose()
  }

  const handleGenerateCode = (): void => {
    const randomCode = '750' + Math.floor(100000000 + Math.random() * 900000000).toString()
    setCode(randomCode)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop">
      <div
        className="w-full max-w-3xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-modal"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f8f9fa] border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded bg-[#0078D4]/10 text-[#0078D4]">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {initialData ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <p className="text-xs text-slate-500">
                Ingresa los datos para registrar el artículo en el catálogo de inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form organized in 2 columns */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Column 1: Basic Information */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">
                  Información Básica
                </span>
              </div>

              {/* Barcode / SKU */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Código de Barras / SKU <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode
                      size={16}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Escanear o ingresar código"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs font-code bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm text-slate-700 whitespace-nowrap transition-colors"
                  >
                    Generar
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Refresco Cola 600ml Desechable"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit of measure */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descripción o Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre presentación, sabor, lote o proveedor..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] resize-none"
                />
              </div>
            </div>

            {/* Column 2: Pricing, Stock & Status */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">
                  Precios e Inventario
                </span>
              </div>

              {/* Cost & Sale Price in 2 sub-columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precio Compra ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice || ''}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-tabular bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precio Venta ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={salePrice || ''}
                      onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-bold font-tabular text-[#0078D4] bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                    />
                  </div>
                </div>
              </div>

              {/* Live profit badge */}
              <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs flex items-center justify-between">
                <span className="text-slate-500">Margen estimado:</span>
                <span className="font-semibold text-emerald-700 font-tabular">
                  +${marginDollar.toFixed(2)} ({marginPercent}%)
                </span>
              </div>

              {/* Stock initial and Min stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock || ''}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs font-tabular bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stock Mínimo Alerta
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStock || ''}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                    placeholder="5"
                    className="w-full px-3 py-1.5 text-xs font-tabular bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                  />
                </div>
              </div>

              {/* Taxes and Active Status toggles */}
              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTax}
                    onChange={(e) => setHasTax(e.target.checked)}
                    className="w-4 h-4 text-[#0078D4] rounded border-slate-300 focus:ring-[#0078D4]"
                  />
                  <span className="text-xs text-slate-700">Aplica Impuesto (IVA 16% incluido)</span>
                </label>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="block text-xs font-medium text-slate-800">
                      Estado del Producto
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {active ? 'Visible en caja para venta' : 'Oculto / Desactivado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      active ? 'bg-[#0078D4]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-[#f8f9fa] border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-sm transition-colors border border-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-medium text-white bg-[#0078D4] hover:bg-[#106EBE] active:bg-[#005A9E] rounded-sm shadow-xs transition-colors"
            >
              <Check size={14} />
              <span>{initialData ? 'Guardar Cambios' : 'Registrar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductModal
