/**
 * Contrato compartido de Producto.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export interface Product {
  id: string
  code: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  maxStock?: number
  unit: string
  /** Si es una variante, id del producto padre al que pertenece. */
  parentId?: string
  /** Atributos de la variante serializados (JSON). Solo en variantes hijas. */
  attributes?: string
  /** Nombres de atributos que definen las variantes del padre (JSON). Solo en el padre. */
  variantAttrs?: string
  /** Si es true, el producto controla stock por lotes con fecha de caducidad. */
  trackBatches?: boolean
  /** Marca del producto (catálogo `brands`). Opcional. */
  brandId?: string
  /** Nombre de la marca resuelto por el repositorio (solo lectura). */
  brandName?: string
  /** Proveedor del producto (catálogo `suppliers`). Opcional. */
  supplierId?: string
  /** Nombre del proveedor resuelto por el repositorio (solo lectura). */
  supplierName?: string
  /** Tipo de producto: simple, combo, service o raw_material. */
  typeId?: string
  /** Nombre del tipo de producto resuelto por el repositorio (solo lectura). */
  typeName?: string
  /** Clave del tipo (simple/combo/service/raw_material), resuelta por el repositorio (solo lectura). */
  typeKind?: import('./product-type.contract').ProductTypeKind
  /** Si el tipo no controla stock (ej. servicios). Resuelto por el repositorio (solo lectura). */
  trackStock?: boolean
  /** Impuesto asignado del catálogo (`taxes`). 0% / `undefined` = exento. */
  taxId?: string
  /** Nombre de la tasa resuelto por el repositorio (solo lectura). */
  taxName?: string
  /** Porcentaje de la tasa resuelto por el repositorio (solo lectura). */
  taxRate?: number
  /**
   * @deprecated Usar `taxId` + catálogo de impuestos.
   * Se conserva para importaciones CSV antiguas y datos legados.
   */
  hasTax?: boolean
  active: boolean
  deleted?: boolean
  description?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un producto (el id y timestamps los genera el backend). */
export type ProductInput = Omit<
  Product,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'taxName'
  | 'taxRate'
  | 'typeName'
  | 'typeKind'
  | 'trackStock'
  | 'brandName'
  | 'supplierName'
>

export interface ProductFilter {
  search?: string
  category?: string
  brandId?: string
  supplierId?: string
  typeId?: string
  includeDeleted?: boolean
  onlyActive?: boolean
}

export type ProductStockFilter = 'ALL' | 'LOW' | 'OUT'

export interface ProductPageQuery extends ProductFilter {
  page: number
  pageSize: number
  taxId?: string
  taxUnassigned?: boolean
  brandUnassigned?: boolean
  supplierUnassigned?: boolean
  typeUnassigned?: boolean
  stockFilter?: ProductStockFilter
  /** Omit aggregate catalog metrics for lightweight product selectors. */
  includeStats?: boolean
}

export interface ProductCatalogStats {
  total: number
  totalStock: number
  totalValue: number
  lowStock: number
  outOfStock: number
}

export interface ProductPageResult {
  items: Product[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  stats?: ProductCatalogStats
}
