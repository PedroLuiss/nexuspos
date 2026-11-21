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
  'Atributos',
  'PadreSKU',
  'ImagenURL'
]

const quote = (value: string): string => `"${value.replace(/"/g, '""')}"`

/** Construye las filas del catálogo en el orden de las columnas oficiales. */
export function buildProductCatalogRows(
  products: Product[],
  brands: Brand[] = [],
  suppliers: Supplier[] = [],
  types: ProductType[] = []
): (string | number)[][] {
  const brandById = new Map(brands.map((b) => [b.id, b.name]))
  const supplierById = new Map(suppliers.map((s) => [s.id, s.name]))
  const typeById = new Map(types.map((t) => [t.id, t.name]))
  const parentSkuById = new Map(products.map((p) => [p.id, p.code]))

  return products.map((product) => [
    product.code,
    product.name,
    product.category,
    product.brandName ?? brandById.get(product.brandId ?? '') ?? '',
    product.supplierName ?? supplierById.get(product.supplierId ?? '') ?? '',
    product.typeName ?? typeById.get(product.typeId ?? '') ?? '',
    product.costPrice,
    product.salePrice,
    product.stock,
    product.minStock,
    product.unit,
    product.description ?? '',
    product.taxName ?? (product.taxRate === 0 ? 'Exento' : ''),
    product.taxRate ?? '',
    product.attributes ?? '',
    product.parentId ? (parentSkuById.get(product.parentId) ?? '') : '',
    product.imageUrl ?? ''
  ])
}

/** Serializa el catálogo completo con marca, proveedor, tipo e impuesto. */
export function buildProductCatalogCsv(
  products: Product[],
  brands: Brand[] = [],
  suppliers: Supplier[] = [],
  types: ProductType[] = []
): string {
  const rows = buildProductCatalogRows(products, brands, suppliers, types)
  const csvValue = (value: string | number): string =>
    typeof value === 'number' ? String(value) : quote(value)

  return [
    PRODUCT_CSV_HEADERS.join(','),
    ...rows.map((row) => row.map(csvValue).join(','))
  ].join('\r\n')
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
  attributes: ['atributos'],
  parentSku: ['padresku', 'padre', 'skupadre'],
  imageUrl: ['imagenurl', 'imagen', 'url']
}

function detectCsvDelimiter(text: string): ',' | ';' {
  const header = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? ''
  let commas = 0
  let semicolons = 0
  let quoted = false
  for (let index = 0; index < header.length; index += 1) {
    const character = header[index]
    if (character === '"' && header[index + 1] === '"' && quoted) {
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (!quoted && character === ',') {
      commas += 1
    } else if (!quoted && character === ';') {
      semicolons += 1
    }
  }
  return semicolons > commas ? ';' : ','
}

function parseCsvRows(text: string): { rows: string[][]; error?: string } {
  const delimiter = detectCsvDelimiter(text)
  const source = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"' && quoted && source[index + 1] === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (!quoted && character === delimiter) {
      row.push(cell.trim())
      cell = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  if (quoted) return { rows: [], error: 'El archivo contiene comillas sin cerrar.' }
  row.push(cell.trim())
  if (row.some((value) => value.length > 0)) rows.push(row)
  return { rows }
}

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

function parseNumber(value: string | undefined): number | undefined {
  const trimmed = value?.replace('%', '').replace(/\s/g, '').trim()
  if (!trimmed) return undefined

  const commaIndex = trimmed.lastIndexOf(',')
  const dotIndex = trimmed.lastIndexOf('.')
  const normalized =
    commaIndex > dotIndex
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.replace(/,/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
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
  defaultTax: TaxRate | null,
  existingProducts: Product[] = []
): ProductCsvParseResult {
  const parsed = parseCsvRows(text)
  if (parsed.error) return { rows: [], errors: [parsed.error] }
  return parseProductCatalogRows(
    parsed.rows,
    taxes,
    brands,
    suppliers,
    types,
    defaultTax,
    existingProducts
  )
}

/** Interpreta filas tabulares ya leídas desde CSV o una hoja XLSX. */
export function parseProductCatalogRows(
  tableRows: string[][],
  taxes: TaxRate[],
  brands: Brand[],
  suppliers: Supplier[],
  types: ProductType[],
  defaultTax: TaxRate | null,
  existingProducts: Product[] = []
): ProductCsvParseResult {
  const errors: string[] = []
  const rows: ProductInput[] = []
  const lines = tableRows.filter((row) => row.some((value) => value.trim().length > 0))

  if (lines.length < 2) {
    return { rows, errors: ['El archivo no contiene filas de datos suficientes.'] }
  }

  const columns = resolveColumns(lines[0])
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
  const existingCodes = new Set(existingProducts.map((product) => product.code.trim().toLowerCase()))
  const importedCodes = new Set<string>()

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
      if (rate === undefined || rate < 0 || rate > 100) {
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
    const row = lines[i]
    const cell = (key: string): string =>
      columns[key] === undefined ? '' : (row[columns[key]] ?? '').trim()

    const code = cell('code')
    const name = cell('name')
    const normalizedCode = code.toLowerCase()
    const salePrice = parseNumber(cell('salePrice'))

    if (!code || !name) {
      errors.push(`Línea ${i + 1}: Código y Nombre son obligatorios.`)
      continue
    }
    if (existingCodes.has(normalizedCode) || importedCodes.has(normalizedCode)) {
      errors.push(`Línea ${i + 1}: el código "${code}" ya existe en el catálogo o en el archivo.`)
      continue
    }
    if (salePrice === undefined || salePrice <= 0) {
      errors.push(`Línea ${i + 1}: el precio de venta debe ser mayor a 0.`)
      continue
    }

    const costPrice = parseNumber(cell('costPrice'))
    const stock = parseNumber(cell('stock'))
    const minStock = parseNumber(cell('minStock'))
    const invalidNumber = [
      ['PrecioCosto', cell('costPrice'), costPrice],
      ['Stock', cell('stock'), stock],
      ['StockMinimo', cell('minStock'), minStock]
    ].find(([, raw, parsedValue]) => raw !== '' && parsedValue === undefined)
    if (invalidNumber) {
      errors.push(`Línea ${i + 1}: el valor de ${invalidNumber[0]} no es numérico.`)
      continue
    }
    if ((costPrice ?? 0) < 0 || (stock ?? 0) < 0 || (minStock ?? 5) < 0) {
      errors.push(`Línea ${i + 1}: costo, stock y stock mínimo no pueden ser negativos.`)
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

    const attributes = cell('attributes').trim()
    const parentSku = cell('parentSku').trim()
    let parentId: string | undefined
    if (parentSku) {
      const parent = existingProducts.find((p) => p.code.trim().toLowerCase() === parentSku.toLowerCase())
      if (!parent) {
        errors.push(`Línea ${i + 1}: no existe un producto padre con SKU "${parentSku}".`)
        continue
      }
      parentId = parent.id
    }

    rows.push({
      code,
      name,
      category: cell('category') || 'General',
      costPrice: costPrice ?? 0,
      salePrice,
      stock: stock ?? 0,
      minStock: minStock ?? 5,
      unit: cell('unit') || 'Pieza (pza)',
      description: cell('description'),
      brandId: brand.id,
      supplierId: supplier.id,
      typeId: type.id,
      taxId: tax.taxId,
      attributes: attributes || undefined,
      parentId,
      imageUrl: cell('imageUrl'),
      active: true
    })
    importedCodes.add(normalizedCode)
  }

  return { rows, errors }
}
