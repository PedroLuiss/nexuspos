import type { Brand, Product, ProductInput, ProductType, Supplier, TaxRate } from '@shared/contracts'

/** Columnas oficiales del CSV de catálogo (incluye impuesto, marca, proveedor y tipo). */
export const PRODUCT_CSV_HEADERS = [
  'Codigo',
  'Nombre',
  'Categoria',
  'Marca',
  'Proveedor',
  'TipoProducto',
  'PrecioCosto',
  'PrecioVenta',
  'Stock',
  'StockMinimo',
  'Unidad',
  'Descripcion',
  'ImpuestoNombre',
  'ImpuestoTasa',
  'ImagenURL'
]

export const PRODUCT_CSV_TEMPLATE = [
  PRODUCT_CSV_HEADERS.join(','),
  '750100000001,Ejemplo Producto General,Abarrotes y Despensa,Genérica,Proveedor General,Producto Simple,15.50,22.00,50,10,Pieza (pza),Producto gravado al 16%,IVA General,16,',
  '750100000002,Ejemplo Producto Reducido,Bebidas y Refrescos,Coca-Cola,Distribuidora Los Andes,Producto Simple,10.00,16.50,100,20,Pieza (pza),Producto gravado al 8%,IVA Reducido,8,',
  '750100000003,Ejemplo Producto Exento,Panaderia,Genérica,Proveedor General,Producto Simple,2.00,3.00,80,15,Pieza (pza),Producto exento,Exento,0,'
].join('\r\n')

const quote = (value: string): string => `"${value.replace(/"/g, '""')}"`

/** Serializa el catálogo completo con marca, proveedor, tipo e impuesto. */
export function buildProductCatalogCsv(
  products: Product[],
  brands: Brand[] = [],
  suppliers: Supplier[] = [],
  types: ProductType[] = []
): string {
  const brandById = new Map(brands.map((b) => [b.id, b.name]))
  const supplierById = new Map(suppliers.map((s) => [s.id, s.name]))
  const typeById = new Map(types.map((t) => [t.id, t.name]))

  const rows = products.map((product) => [
    quote(product.code),
    quote(product.name),
    quote(product.category),
    quote(product.brandName ?? brandById.get(product.brandId ?? '') ?? ''),
    quote(product.supplierName ?? supplierById.get(product.supplierId ?? '') ?? ''),
    quote(product.typeName ?? typeById.get(product.typeId ?? '') ?? ''),
    product.costPrice.toFixed(2),
    product.salePrice.toFixed(2),
    String(product.stock),
    String(product.minStock),
    quote(product.unit),
    quote(product.description ?? ''),
    quote(product.taxName ?? (product.taxRate === 0 ? 'Exento' : '')),
    product.taxRate === undefined ? '' : String(product.taxRate),
    quote(product.imageUrl ?? '')
  ])

  return [PRODUCT_CSV_HEADERS.join(','), ...rows.map((row) => row.join(','))].join('\r\n')
}

export interface ProductCsvParseResult {
  rows: ProductInput[]
  errors: string[]
}

const COLUMN_ALIASES: Record<string, string[]> = {
  code: ['codigo', 'codigobarras', 'sku'],
  name: ['nombre', 'producto'],
  category: ['categoria', 'rubro'],
  brand: ['marca'],
  supplier: ['proveedor'],
  type: ['tipoproducto', 'tipo', 'tipoproducto'],
  costPrice: ['preciocosto', 'costo'],
  salePrice: ['precioventa', 'precio'],
  stock: ['stock', 'existencia'],
  minStock: ['stockminimo', 'minimo'],
  unit: ['unidad', 'medida'],
  description: ['descripcion', 'detalle'],
  taxName: ['impuestonombre', 'nombreimpuesto', 'impuesto'],
  taxRate: ['impuestotasa', 'tasaimpuesto', 'impuestoporcentaje', 'porcentajeimpuesto'],
  hasTax: ['tieneimpuesto'],
  imageUrl: ['imagenurl', 'imagen', 'url']
}

const splitCsvLine = (line: string): string[] =>
  line
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))

const headerKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

function resolveColumns(headers: string[]): Record<string, number> {
  const normalized = headers.map(headerKey)
  const columns: Record<string, number> = {}
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = normalized.findIndex((header) => aliases.includes(header))
    if (index >= 0) columns[key] = index
  }
  return columns
}

function parseNumber(value: string | undefined): number {
  const parsed = Number((value ?? '').replace('%', '').replace(',', '.').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Convierte un CSV de productos a `ProductInput[]`.
 *
 * Acepta el formato nuevo (`ImpuestoNombre`/`ImpuestoTasa`) y el legado
 * (`TieneImpuesto` SI/NO). Si la tasa/marca/proveedor/tipo no existe en el
 * catálogo se reporta el error por fila para que el usuario lo cree en Ajustes.
 */
export function parseProductCatalogCsv(
  text: string,
  taxes: TaxRate[],
  brands: Brand[],
  suppliers: Supplier[],
  types: ProductType[],
  defaultTax: TaxRate | null
): ProductCsvParseResult {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const errors: string[] = []
  const rows: ProductInput[] = []

  if (lines.length < 2) {
    return { rows, errors: ['El archivo no contiene filas de datos suficientes.'] }
  }

  const columns = resolveColumns(splitCsvLine(lines[0]))
  for (const required of ['code', 'name', 'salePrice']) {
    if (columns[required] === undefined) {
      return {
        rows,
        errors: [`Falta la columna obligatoria "${required}" en el encabezado del archivo.`]
      }
    }
  }

  const activeTaxes = taxes.filter((tax) => tax.active)
  const activeBrands = brands.filter((b) => b.active)
  const activeSuppliers = suppliers.filter((s) => s.active)
  const activeTypes = types.filter((t) => t.active)
  const exemptTax = activeTaxes.find((tax) => tax.rate === 0) ?? null

  const resolveRef = (
    rawValue: string,
    catalog: { id: string; name: string }[],
    fieldName: string
  ): { id?: string; error?: string } => {
    if (!rawValue?.trim()) return {}
    const trimmed = rawValue.trim()
    const byName = catalog.find((item) => headerKey(item.name) === headerKey(trimmed))
    if (!byName) {
      return { error: `no existe el ${fieldName} "${trimmed}" en el catálogo` }
    }
    return { id: byName.id }
  }

  const resolveTax = (row: string[]): { taxId?: string; error?: string } => {
    const rawRate = columns.taxRate !== undefined ? row[columns.taxRate]?.trim() : ''
    const rawName = columns.taxName !== undefined ? row[columns.taxName]?.trim() : ''

    if (rawRate) {
      const rate = parseNumber(rawRate)
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return { error: `tasa "${rawRate}" inválida` }
      }
      const byName = rawName
        ? activeTaxes.find(
            (tax) => headerKey(tax.name) === headerKey(rawName) && Math.abs(tax.rate - rate) < 0.001
          )
        : undefined
      const match = byName ?? activeTaxes.find((tax) => Math.abs(tax.rate - rate) < 0.001)
      if (!match) {
        return { error: `no existe una tasa de ${rate}% en el catálogo` }
      }
      return { taxId: match.id }
    }

    if (rawName) {
      const byName = activeTaxes.find((tax) => headerKey(tax.name) === headerKey(rawName))
      if (!byName) return { error: `no existe la tasa "${rawName}" en el catálogo` }
      return { taxId: byName.id }
    }

    const legacy = (columns.hasTax !== undefined ? row[columns.hasTax] : '') ?? ''
    if (headerKey(legacy) === 'no') {
      if (!exemptTax) return { error: 'no hay una tasa 0% (Exento) configurada' }
      return { taxId: exemptTax.id }
    }

    return { taxId: defaultTax?.id }
  }

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i])
    const cell = (key: string): string =>
      columns[key] === undefined ? '' : (row[columns[key]] ?? '').trim()

    const code = cell('code')
    const name = cell('name')
    const salePrice = parseNumber(cell('salePrice'))

    if (!code || !name) {
      errors.push(`Línea ${i + 1}: Código y Nombre son obligatorios.`)
      continue
    }
    if (salePrice <= 0) {
      errors.push(`Línea ${i + 1}: el precio de venta debe ser mayor a 0.`)
      continue
    }

    const tax = resolveTax(row)
    if (tax.error) {
      errors.push(`Línea ${i + 1}: ${tax.error}. Créela en Ajustes › Impuestos.`)
      continue
    }

    const brand = resolveRef(cell('brand'), activeBrands, 'marca')
    if (brand.error) {
      errors.push(`Línea ${i + 1}: ${brand.error}.`)
      continue
    }

    const supplier = resolveRef(cell('supplier'), activeSuppliers, 'proveedor')
    if (supplier.error) {
      errors.push(`Línea ${i + 1}: ${supplier.error}.`)
      continue
    }

    const type = resolveRef(cell('type'), activeTypes, 'tipo de producto')
    if (type.error) {
      errors.push(`Línea ${i + 1}: ${type.error}.`)
      continue
    }

    rows.push({
      code,
      name,
      category: cell('category') || 'General',
      costPrice: parseNumber(cell('costPrice')),
      salePrice,
      stock: parseNumber(cell('stock')),
      minStock: columns.minStock !== undefined ? parseNumber(cell('minStock')) : 5,
      unit: cell('unit') || 'Pieza (pza)',
      description: cell('description'),
      brandId: brand.id,
      supplierId: supplier.id,
      typeId: type.id,
      taxId: tax.taxId,
      imageUrl: cell('imageUrl'),
      active: true
    })
  }

  return { rows, errors }
}
