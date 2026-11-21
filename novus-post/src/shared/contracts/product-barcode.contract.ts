/**
 * Contrato compartido de Código de Barras de producto.
 * Un producto puede tener múltiples códigos de barras (EAN-13, Code128, etc.),
 * por ejemplo uno para la caja, otro para la unidad suelta y otro para el paquete.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni nada de React.
 */
export type BarcodeFormat = 'EAN-13' | 'EAN-8' | 'UPC-A' | 'Code128' | 'Code39' | 'ITF-14' | 'OTRO'

export interface ProductBarcode {
  id: string
  productId: string
  /** Código de barras (ej. 7501000000012). */
  barcode: string
  format: BarcodeFormat
  /** Etiqueta descriptiva opcional (ej. "Caja x 12", "Unidad suelta"). */
  label?: string
  /** Indica si es el código principal usado para búsquedas rápidas. */
  isPrimary: boolean
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un código de barras (el id y timestamps los genera el backend). */
export type ProductBarcodeInput = Omit<
  ProductBarcode,
  'id' | 'createdAt' | 'updatedAt' | 'deleted'
>

export interface ProductBarcodeFilter {
  productId?: string
  includeDeleted?: boolean
  onlyActive?: boolean
  search?: string
}

export interface ProductBarcodePreviewInput {
  barcode: string
  format: BarcodeFormat
}

export interface ProductBarcodeLabelInput {
  productId: string
  barcodeId?: string
  copies: number
  widthMm: number
  heightMm: number
  marginMm: number
  includePrice: boolean
}
