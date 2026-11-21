/**
 * Contrato compartido de Precio por Mayoreo (tier) de producto.
 * Permite definir escalas de cantidad con precios diferentes,
 * por ejemplo: 1-9 a $100, 10-49 a $90, 50+ a $80.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface ProductPriceTier {
  id: string
  productId: string
  /** Cantidad mínima para aplicar este precio (inclusive). */
  minQuantity: number
  /** Cantidad máxima para aplicar este precio (inclusive). Opcional: sin límite superior. */
  maxQuantity?: number
  /** Precio de venta unitario cuando la cantidad cae en este rango. */
  price: number
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un precio por mayoreo (el id y timestamps los genera el backend). */
export type ProductPriceTierInput = Omit<
  ProductPriceTier,
  'id' | 'createdAt' | 'updatedAt' | 'deleted'
>

export interface ProductPriceTierFilter {
  productId?: string
  includeDeleted?: boolean
  onlyActive?: boolean
}
