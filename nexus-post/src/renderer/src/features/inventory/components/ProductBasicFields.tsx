import React, { useRef } from 'react'
import { Barcode, X, Upload } from '../../../shared/icons/Icons'
import ProductAvatar from '../../../shared/ui/ProductAvatar'
import type { ProductFormValues } from '../hooks/useProductForm'

interface ProductBasicFieldsProps {
  values: ProductFormValues
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  categories: string[]
  units: string[]
  onGenerateCode: () => void
}

export const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({
  values,
  update,
  categories,
  units,
  onGenerateCode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convertir imagen local a base64 DataURL para persistir directo en SQLite
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        update('imageUrl', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3.5">
      <div className="border-b border-slate-100 pb-2">
        <span className="text-xs font-semibold text-[#0067C0] uppercase tracking-wider">
          Información Básica
        </span>
      </div>

      {/* Selector de Imagen del Producto */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Imagen del Producto <span className="text-slate-400 font-normal">(Opcional)</span>
        </label>
        <div className="flex items-center gap-3 p-2 bg-[#F9F9F9] border border-slate-200 rounded-[6px]">
          <div className="relative flex-shrink-0">
            <ProductAvatar
              name={values.name || 'Producto'}
              imageUrl={values.imageUrl}
              size="lg"
            />
            {values.imageUrl && (
              <button
                type="button"
                onClick={() => update('imageUrl', '')}
                title="Eliminar imagen"
                className="absolute -top-1.5 -right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors shadow-xs z-10 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-300 rounded-[4px] text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Upload size={13} className="text-[#0067C0]" />
                <span>Subir Archivo</span>
              </button>
              <span className="text-[10px] text-slate-400">JPG, PNG o WebP</span>
            </div>
            <input
              type="url"
              placeholder="O pegar URL web de la imagen..."
              value={values.imageUrl.startsWith('data:') ? '' : values.imageUrl}
              onChange={(e) => update('imageUrl', e.target.value)}
              className="w-full px-2 py-1 text-[11px] bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] truncate"
            />
          </div>
        </div>
      </div>

      {/* Código de barras / SKU */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Código de Barras / SKU <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Escanear o ingresar código"
              value={values.code}
              onChange={(e) => update('code', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
            />
          </div>
          <button
            type="button"
            onClick={onGenerateCode}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-[4px] text-slate-700 whitespace-nowrap transition-colors cursor-pointer"
          >
            Generar
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Nombre del Producto <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="Ej. Refresco Cola 600ml Desechable"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
          <select
            value={values.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Unidad de Medida</label>
          <select
            value={values.unit}
            onChange={(e) => update('unit', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Descripción o Notas (Opcional)
        </label>
        <textarea
          rows={2}
          placeholder="Detalles sobre presentación, sabor, lote o proveedor..."
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] resize-none"
        />
      </div>
    </div>
  )
}

export default ProductBasicFields
