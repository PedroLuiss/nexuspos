import React, { useState } from 'react'
import type {
  Brand,
  BrandInput,
  Supplier,
  SupplierInput,
  ProductType,
  ProductTypeInput
} from '@shared/contracts'
import {
  X,
  ShieldAlert,
  AlertCircle,
  Building2,
  Truck,
  Package
} from '../../../shared/icons/Icons'
import { useBrands } from '../../../shared/hooks/useBrands'
import { useSuppliers } from '../../../shared/hooks/useSuppliers'
import { useProductTypes } from '../../../shared/hooks/useProductTypes'
import { CatalogEditor } from './CatalogEditor'

const tabClass =
  'px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer'

interface ProductCatalogsSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  canEdit: boolean
}

/**
 * Configuración de catálogos de producto: Marcas, Proveedores y Tipos.
 * Solo ADMIN puede crear/editar/eliminar.
 */
export const ProductCatalogsSettingsModal: React.FC<ProductCatalogsSettingsModalProps> = ({
  isOpen,
  onClose,
  canEdit
}) => {
  const [activeTab, setActiveTab] = useState<'brands' | 'suppliers' | 'types'>('brands')

  const {
    brands,
    isLoading: brandsLoading,
    error: brandsError,
    createBrand,
    updateBrand,
    deleteBrand
  } = useBrands()

  const {
    suppliers,
    isLoading: suppliersLoading,
    error: suppliersError,
    createSupplier,
    updateSupplier,
    deleteSupplier
  } = useSuppliers()

  const {
    types,
    isLoading: typesLoading,
    error: typesError,
    createProductType,
    updateProductType,
    deleteProductType
  } = useProductTypes()

  if (!isOpen) return null

  const isLoading = brandsLoading || suppliersLoading || typesLoading
  const error = brandsError || suppliersError || typesError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-3xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Catálogos de Producto
              </h2>
              <p className="text-[11px] text-[#717783]">
                Marcas, proveedores y tipos de producto para clasificar el catálogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {!canEdit && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldAlert size={13} className="text-slate-500" />
            <span>
              Modo lectura: solo el Administrador puede modificar estos catálogos.
            </span>
          </div>
        )}

        {error && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E5] bg-[#F9F9F9]">
          {[
            { id: 'brands', label: 'Marcas', icon: <Building2 size={14} /> },
            { id: 'suppliers', label: 'Proveedores', icon: <Truck size={14} /> },
            { id: 'types', label: 'Tipos de Producto', icon: <Package size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'brands' | 'suppliers' | 'types')}
              className={`${tabClass} border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#0067C0] text-[#0067C0] bg-blue-50/40'
                  : 'text-slate-600 hover:text-[#1B1B1B] hover:bg-white'
              }`}
            >
              {tab.icon}
              <span className="ml-1">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {activeTab === 'brands' && (
            <CatalogEditor
              items={brands}
              canEdit={canEdit && !isLoading}
              error={brandsError}
              createItem={(input: Pick<BrandInput, 'name' | 'active'>) => createBrand(input)}
              updateItem={(item: Brand) => updateBrand(item)}
              deleteItem={(id: string) => deleteBrand(id)}
              itemLabel={(item: Brand) => String(item.name)}
              itemSubtitle={(item: Brand) => item.description ?? undefined}
              placeholderName="Ej. Nestlé, Coca-Cola, Pepsi…"
              entityName="marca"
            />
          )}
          {activeTab === 'suppliers' && (
            <CatalogEditor
              items={suppliers}
              canEdit={canEdit && !isLoading}
              error={suppliersError}
              createItem={(input: Pick<SupplierInput, 'name' | 'active'>) => createSupplier(input)}
              updateItem={(item: Supplier) => updateSupplier(item)}
              deleteItem={(id: string) => deleteSupplier(id)}
              itemLabel={(item: Supplier) => String(item.name)}
              itemSubtitle={(item: Supplier) =>
                item.contactName ? `Contacto: ${item.contactName}` : undefined
              }
              placeholderName="Ej. Distribuidora Los Andes, Importadora ABC…"
              entityName="proveedor"
            />
          )}
          {activeTab === 'types' && (
            <CatalogEditor
              items={types}
              canEdit={canEdit && !isLoading}
              error={typesError}
              createItem={(input: Pick<ProductTypeInput, 'name' | 'active'>) =>
                createProductType({ ...input, kind: 'simple', trackStock: true })
              }
              updateItem={(item: ProductType) => updateProductType(item)}
              deleteItem={(id: string) => deleteProductType(id)}
              itemLabel={(item: ProductType) => String(item.name)}
              itemSubtitle={(item: ProductType) =>
                item.trackStock ? 'Con control de stock' : 'Servicio (sin stock)'
              }
              placeholderName="Ej. Producto Simple, Combo, Servicio, Insumo…"
              entityName="tipo de producto"
            />
          )}
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500">
            Estos catálogos se usan en el formulario de producto para clasificar cada ítem.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCatalogsSettingsModal
