import ExcelJS from 'exceljs'
import type { Brand, Product, ProductType, Supplier, TaxRate } from '@shared/contracts'
import {
  buildProductCatalogRows,
  parseProductCatalogCsv,
  parseProductCatalogRows,
  PRODUCT_CSV_HEADERS,
  type ProductCsvParseResult
} from './productCsv'

const COLUMN_WIDTHS = [18, 30, 24, 20, 24, 22, 14, 14, 12, 14, 18, 36, 20, 14, 26, 18, 32]
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function configureProductSheet(sheet: ExcelJS.Worksheet): void {
  sheet.columns = PRODUCT_CSV_HEADERS.map((header, index) => ({
    header,
    key: `column${index}`,
    width: COLUMN_WIDTHS[index]
  }))
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: PRODUCT_CSV_HEADERS.length }
  }
  sheet.getRow(1).height = 30
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF00A6A6' } } }
  })

  for (const column of [7, 8]) sheet.getColumn(column).numFmt = '#,##0.00'
  for (const column of [9, 10, 14]) sheet.getColumn(column).numFmt = '#,##0.###'
}

function styleProductRows(sheet: ExcelJS.Worksheet): void {
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, sheet.rowCount), column: PRODUCT_CSV_HEADERS.length }
  }
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.height = 22
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowNumber % 2 === 0 ? 'FFF2F6FA' : 'FFFFFFFF' }
      }
      cell.font = { size: 10, color: { argb: 'FF263445' } }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD9E2F0' } } }
    })
  })
}

function downloadWorkbook(buffer: ExcelJS.Buffer, fileName: string): void {
  const blob = new Blob([buffer], { type: XLSX_MIME })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function createGuideSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Guía', { properties: { tabColor: { argb: 'FF00A6A6' } } })
  sheet.columns = [{ width: 28 }, { width: 88 }]
  sheet.mergeCells('A1:B1')
  sheet.getCell('A1').value = 'NEXUSPOS  |  PLANTILLA DE PRODUCTOS'
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } }
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 36
  sheet.mergeCells('A2:B2')
  sheet.getCell('A2').value =
    'Complete la hoja Productos y conserve los nombres de las columnas. La fila de ejemplo de esta guía no se importa.'
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF526579' }, size: 11 }
  sheet.getCell('A2').alignment = { wrapText: true, vertical: 'middle' }
  sheet.getRow(2).height = 32

  const instructions = [
    ['CAMPO', 'CÓMO COMPLETARLO'],
    ['Obligatorios', 'Codigo, Nombre y PrecioVenta (mayor que cero).'],
    ['Números', 'Use números sin símbolos de moneda. Stock y costo vacíos se importan como 0.'],
    ['Impuesto', 'Use ImpuestoNombre o ImpuestoTasa de una tasa activa en Ajustes. Si se dejan vacíos, se usa la tasa predeterminada.'],
    ['Marca / Proveedor / TipoProducto', 'Son opcionales; si los escribe, deben coincidir con un registro activo del catálogo.'],
    ['Variantes', 'El PadreSKU debe corresponder a un producto ya existente en el catálogo.'],
    ['Importación', 'La importación crea productos nuevos; los códigos existentes o repetidos se reportan como error y no se sobrescriben.'],
    ['Ejemplo (no importar)', 'SKU-EJEMPLO-001 | Producto de ejemplo | General | 10 | 15 | 0']
  ]
  instructions.forEach((values, index) => {
    const row = sheet.addRow(values)
    row.height = index === 0 ? 24 : 30
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9E2F0' } } }
      if (index === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00A6A6' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: index % 2 === 0 ? 'FFF2F6FA' : 'FFFFFFFF' }
        }
        cell.font = { size: 10, color: { argb: 'FF263445' } }
      }
    })
  })
  sheet.views = [{ state: 'frozen', ySplit: 3 }]
}

export async function downloadProductTemplateXlsx(): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NexusPOS'
  workbook.subject = 'Plantilla para importación de productos'
  workbook.created = new Date()
  const productsSheet = workbook.addWorksheet('Productos', {
    properties: { tabColor: { argb: 'FF17365D' } }
  })
  configureProductSheet(productsSheet)
  createGuideSheet(workbook)
  const buffer = await workbook.xlsx.writeBuffer()
  downloadWorkbook(buffer, 'plantilla_productos_nexuspos.xlsx')
}

export async function downloadProductCatalogXlsx(
  products: Product[],
  brands: Brand[],
  suppliers: Supplier[],
  types: ProductType[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NexusPOS'
  workbook.subject = 'Catálogo exportado de productos'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Productos', {
    properties: { tabColor: { argb: 'FF107C41' } }
  })
  configureProductSheet(sheet)
  buildProductCatalogRows(products, brands, suppliers, types).forEach((row) => sheet.addRow(row))
  styleProductRows(sheet)

  const summary = workbook.addWorksheet('Resumen')
  summary.columns = [{ width: 28 }, { width: 30 }]
  summary.mergeCells('A1:B1')
  summary.getCell('A1').value = 'NEXUSPOS  |  EXPORTACIÓN DE PRODUCTOS'
  summary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } }
  summary.getCell('A1').font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } }
  summary.getRow(1).height = 34
  summary.addRows([
    ['Fecha de exportación', new Date()],
    ['Productos incluidos', products.length],
    ['Hoja de datos', 'Productos']
  ])
  summary.getCell('B2').numFmt = 'yyyy-mm-dd hh:mm'
  summary.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FA' } }
      cell.font = { size: 11, color: { argb: 'FF263445' } }
      cell.alignment = { vertical: 'middle' }
    })
  })
  const buffer = await workbook.xlsx.writeBuffer()
  downloadWorkbook(buffer, `nexuspos_productos_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function parseProductSpreadsheet(
  file: File,
  taxes: TaxRate[],
  brands: Brand[],
  suppliers: Supplier[],
  types: ProductType[],
  defaultTax: TaxRate | null,
  existingProducts: Product[]
): Promise<ProductCsvParseResult> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseProductCatalogCsv(
      await file.text(),
      taxes,
      brands,
      suppliers,
      types,
      defaultTax,
      existingProducts
    )
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return { rows: [], errors: ['Formato no compatible. Seleccione un archivo .xlsx o .csv.'] }
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const sheet =
    workbook.getWorksheet('Productos') ??
    workbook.worksheets.find((worksheet) => worksheet.rowCount > 0)
  if (!sheet) return { rows: [], errors: ['El archivo Excel no contiene una hoja con productos.'] }

  const tableRows: string[][] = []
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = []
    for (let column = 1; column <= Math.max(row.cellCount, PRODUCT_CSV_HEADERS.length); column += 1) {
      values.push(cellValueToString(row.getCell(column).value))
    }
    tableRows.push(values)
  })

  const headerRow = tableRows.findIndex((row) => {
    const normalized = row.map(normalizeHeader)
    return normalized.includes('codigo') && normalized.includes('nombre')
  })
  if (headerRow < 0) {
    return { rows: [], errors: ['No se encontró el encabezado de columnas en la hoja Excel.'] }
  }

  return parseProductCatalogRows(
    tableRows.slice(headerRow),
    taxes,
    brands,
    suppliers,
    types,
    defaultTax,
    existingProducts
  )
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'SI' : 'NO'
  if (value instanceof Date) return value.toISOString()
  if ('result' in value) return cellValueToString(value.result as ExcelJS.CellValue)
  if ('text' in value && typeof value.text === 'string') return value.text
  if ('richText' in value && Array.isArray(value.richText)) {
    return value.richText.map((item) => item.text).join('')
  }
  return ''
}
