import { useCallback, useState } from 'react'
import type { Product, ProductInput } from '@shared/contracts'

export const PRODUCT_UNITS = [
  'Pieza (pza)',
  'Unidad (und)',
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
  imageUrl: string
  costPrice: number
  profitMarginPercent: number
  salePrice: number
  stock: number
  minStock: number
  hasTax: boolean
  active: boolean
}

export interface UseProductFormResult {
  values: ProductFormValues
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  setCostPrice: (cost: number) => void
  setProfitMarginPercent: (margin: number) => void
  setSalePrice: (sale: number) => void
  generateCode: () => void
  marginDollar: number
  marginPercent: string
  toInput: () => ProductInput
}

function initialValues(initialData?: Product | null, categories: string[] = []): ProductFormValues {
  const cost = initialData?.costPrice ?? 0
  const sale = initialData?.salePrice ?? 0
  let margin = 10 // 10% por defecto según requerimiento

  if (initialData && cost > 0 && sale > 0) {
    margin = Number((((sale - cost) / cost) * 100).toFixed(1))
  } else if (cost > 0 && sale === 0) {
    // Si viene costo sin venta, calcular venta al 10%
    return {
      code: initialData?.code ?? '',
      name: initialData?.name ?? '',
      category: initialData?.category || categories[0] || '',
      unit: initialData?.unit || PRODUCT_UNITS[0],
      description: initialData?.description ?? '',
      imageUrl: initialData?.imageUrl ?? '',
      costPrice: cost,
      profitMarginPercent: 10,
      salePrice: Number((cost * 1.1).toFixed(2)),
      stock: initialData?.stock ?? 0,
      minStock: initialData?.minStock ?? 5,
      hasTax: initialData?.hasTax ?? true,
      active: initialData?.active ?? true
    }
  }

  return {
    code: initialData?.code ?? '',
    name: initialData?.name ?? '',
    category: initialData?.category || categories[0] || '',
    unit: initialData?.unit || PRODUCT_UNITS[0],
    description: initialData?.description ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    costPrice: cost,
    profitMarginPercent: margin,
    salePrice: sale > 0 ? sale : Number((cost * (1 + margin / 100)).toFixed(2)),
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

  // Al cambiar el Costo, se actualiza automáticamente el Precio de Venta según el % de Ganancia
  const setCostPrice = useCallback((cost: number) => {
    setValues((prev) => {
      const validCost = Math.max(0, cost)
      const calculatedSale = Number((validCost * (1 + prev.profitMarginPercent / 100)).toFixed(2))
      return {
        ...prev,
        costPrice: validCost,
        salePrice: calculatedSale
      }
    })
  }, [])

  // Al cambiar el % de Ganancia, se calcula automáticamente el Precio de Venta = Costo * (1 + % / 100)
  const setProfitMarginPercent = useCallback((margin: number) => {
    setValues((prev) => {
      const calculatedSale = Number((prev.costPrice * (1 + margin / 100)).toFixed(2))
      return {
        ...prev,
        profitMarginPercent: margin,
        salePrice: calculatedSale
      }
    })
  }, [])

  // Si se ingresa un Precio de Venta manual, recalcula el % de Ganancia en reversa
  const setSalePrice = useCallback((sale: number) => {
    setValues((prev) => {
      const validSale = Math.max(0, sale)
      const calculatedMargin =
        prev.costPrice > 0
          ? Number((((validSale - prev.costPrice) / prev.costPrice) * 100).toFixed(1))
          : 0
      return {
        ...prev,
        salePrice: validSale,
        profitMarginPercent: calculatedMargin
      }
    })
  }, [])

  const generateCode = useCallback(() => {
    const random = '750' + Math.floor(100000000 + Math.random() * 900000000).toString()
    update('code', random)
  }, [update])

  const marginDollar = values.salePrice - values.costPrice
  const marginPercent = values.profitMarginPercent.toFixed(1)

  const toInput = useCallback((): ProductInput => {
    return {
      code: values.code.trim(),
      name: values.name.trim(),
      category: values.category,
      unit: values.unit,
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim() || undefined,
      costPrice: Number(values.costPrice),
      salePrice: Number(values.salePrice),
      stock: Number(values.stock),
      minStock: Number(values.minStock),
      hasTax: values.hasTax,
      active: values.active
    }
  }, [values])

  return {
    values,
    update,
    setCostPrice,
    setProfitMarginPercent,
    setSalePrice,
    generateCode,
    marginDollar,
    marginPercent,
    toInput
  }
}
