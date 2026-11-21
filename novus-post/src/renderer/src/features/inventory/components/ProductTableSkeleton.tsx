import React from 'react'

interface ProductTableSkeletonProps {
  rows?: number
}

/**
 * Skeleton loader de alta fidelidad para la tabla densa del catálogo de productos.
 * Mantiene la altura fija de 40px por fila y el layout exacto de 10 columnas
 * para evitar saltos visuales (Layout Shift) en WinUI 3 Fluent Design.
 */
export const ProductTableSkeleton: React.FC<ProductTableSkeletonProps> = ({ rows = 10 }) => {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr
          key={index}
          className="border-b border-[#E5E5E5] even:bg-[#FDFDFD] odd:bg-white animate-pulse"
          style={{ height: '40px' }}
        >
          {/* Código / SKU */}
          <td className="py-2 px-3">
            <div className="h-3 w-16 bg-[#E5E5E5] rounded-[3px]" />
          </td>

          {/* Producto (Avatar 32x32 + Nombre + Subetiqueta) */}
          <td className="py-2 px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-[#E5E5E5] shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div
                  className="h-3 bg-[#E5E5E5] rounded-[3px]"
                  style={{ width: `${60 + ((index * 17) % 35)}%` }}
                />
                <div className="h-2 w-1/3 bg-[#F0F0F0] rounded-[3px]" />
              </div>
            </div>
          </td>

          {/* Costo */}
          <td className="py-2 px-3">
            <div className="h-3 w-12 bg-[#E5E5E5] rounded-[3px] ml-auto" />
          </td>

          {/* Precio de Venta */}
          <td className="py-2 px-3">
            <div className="h-3 w-14 bg-[#E5E5E5] rounded-[3px] ml-auto" />
          </td>

          {/* Stock actual */}
          <td className="py-2 px-3">
            <div className="h-4 w-12 bg-[#E5E5E5] rounded-full mx-auto" />
          </td>

          {/* Stock Mínimo */}
          <td className="py-2 px-3">
            <div className="h-3 w-8 bg-[#E5E5E5] rounded-[3px] mx-auto" />
          </td>

          {/* Alícuota de Impuesto */}
          <td className="py-2 px-3">
            <div className="h-4 w-14 bg-[#E5E5E5] rounded-full mx-auto" />
          </td>

          {/* Categoría */}
          <td className="py-2 px-3">
            <div className="h-4 w-16 bg-[#E5E5E5] rounded-full mx-auto" />
          </td>

          {/* Switch de Estado Activo/Inactivo */}
          <td className="py-2 px-3">
            <div className="h-4 w-8 bg-[#E5E5E5] rounded-full mx-auto" />
          </td>

          {/* Acciones */}
          <td className="py-2 px-3">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-6 h-6 rounded-[3px] bg-[#E5E5E5]" />
              <div className="w-6 h-6 rounded-[3px] bg-[#E5E5E5]" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export default ProductTableSkeleton
