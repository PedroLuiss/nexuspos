import { useCallback, useState } from 'react'
import type { Product, ProductInput } from '@shared/contracts'

export const PRODUCT_UNITS = [
  'Pieza (pza)',
  'Kilogramo (kg)',
  'Litro (lt)',
  'Caja (caja)',
  'Paquete (paq)'
]

export interface ProductFormValues {
  code: string
  name: string
  category: string
  unit: string
  description: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  hasTax: boolean
  active: boolean
}

export interface UseProductFormResult {
  values: ProductFormValues
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  generateCode: () => void
  marginDollar: number
  marginPercent: string
  toInput: () => ProductInput
}

function initialValues(initialData?: Product | null, categories: string[] = []): ProductFormValues {
  return {
    code: initialData?.code ?? '',
    name: initialData?.name ?? '',
    category: initialData?.category || categories[0] || '',
    unit: initialData?.unit || PRODUCT_UNITS[0],
    description: initialData?.description ?? '',
    costPrice: initialData?.costPrice ?? 0,
    salePrice: initialData?.salePrice ?? 0,
    stock: initialData?.stock ?? 0,
    minStock: initialData?.minStock ?? 5,
    hasTax: initialData?.hasTax ?? true,
    active: initialData?.active ?? true
  }
}

/** Estado y derivados del formulario de producto (alta/edición). */
export function useProductForm(
  initialData?: Product | null,
  categories: string[] = []
): UseProductFormResult {
  const [values, setValues] = useState<ProductFormValues>(() =>
    initialValues(initialData, categories)
  )

  const update = useCallback(
    <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    []
  )

  const generateCode = useCallback(() => {
    const random = '750' + Math.floor(100000000 + Math.random() * 900000000).toString()
    update('code', random)
  }, [update])

  const marginDollar = values.salePrice - values.costPrice
  const marginPercent = values.costPrice > 0 ? ((marginDollar / values.costPrice) * 100).toFixed(1) : '0'

  const toInput = useCallback((): ProductInput => {
    return {
      code: values.code.trim(),
      name: values.name.trim(),
      category: values.category,
      unit: values.unit,
      description: values.description.trim(),
      costPrice: Number(values.costPrice),
      salePrice: Number(values.salePrice),
      stock: Number(values.stock),
      minStock: Number(values.minStock),
      hasTax: values.hasTax,
      active: values.active
    }
  }, [values])

  return { values, update, generateCode, marginDollar, marginPercent, toInput }
}
