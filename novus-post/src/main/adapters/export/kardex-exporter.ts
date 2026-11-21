import { app, BrowserWindow, dialog } from 'electron'
import ExcelJS from 'exceljs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CURRENCY_OPTIONS } from '@shared/contracts'
import type {
  BusinessConfig,
  CurrencyCode,
  KardexExportFormat,
  KardexMovement,
  KardexMovementQuery
} from '@shared/contracts'

const SOURCE_LABELS: Record<KardexMovement['source'], string> = {
  INVENTORY: 'Inventario',
  POS: 'Venta POS',
  CASH: 'Caja / devolución',
  LEGACY: 'Histórico'
}
const EXCEL_CURRENCY_FORMAT: Record<CurrencyCode, string> = {
  USD: '"US$ " #,##0.00',
  EUR: '"€ " #,##0.00',
  VES: '"Bs. " #,##0.00'
}

function periodLabel(period: KardexMovementQuery['period']): string {
  const labels = {
    WEEK: 'Semana actual (lunes a domingo)',
    MONTH: 'Mes actual',
    YEAR: 'Año actual',
    ALL: 'Todo el historial'
  }
  return labels[period]
}

function reasonLabel(reason: KardexMovementQuery['reason']): string {
  return reason === 'ALL' ? 'Todos' : reason.replace(/_/g, ' ')
}

function typeLabel(type: KardexMovementQuery['type']): string {
  if (type === 'ALL') return 'Todos'
  return type === 'ENTRADA' ? 'Entradas' : 'Salidas'
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('es-VE', { maximumFractionDigits: 3 }).format(value)
}

function formatMoney(value: number | undefined, currency: CurrencyCode): string {
  if (value === undefined) return '—'
  const symbol = CURRENCY_OPTIONS.find((option) => option.code === currency)?.symbol ?? currency
  const amount = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
  return `${symbol} ${amount}`
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'medium' })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function businessHeaderLines(business: BusinessConfig): [string, string, string, string] {
  const legalName = business.legalName.trim()
  const tradeName = business.tradeName.trim()
  const companyName = tradeName || legalName || 'Datos del negocio no configurados'
  const fiscalDetails = [
    legalName && legalName !== companyName ? legalName : '',
    business.taxIdType === 'RIF' && business.taxId.trim() ? `RIF: ${business.taxId.trim()}` : '',
    business.taxRegime.trim()
  ]
    .filter(Boolean)
    .join('  |  ')
  const address =
    [
      business.address,
      business.district,
      business.city,
      business.state,
      business.municipality,
      business.parish,
      business.country
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(', ') || 'Dirección no configurada'
  const contact = [business.phone, business.mobile, business.email, business.website]
    .map((value) => value.trim())
    .filter(Boolean)
    .join('  |  ')

  return [
    companyName,
    fiscalDetails || 'Datos fiscales no configurados',
    address,
    contact || 'Datos de contacto no configurados'
  ]
}

function addExcelBusinessHeader(
  sheet: ExcelJS.Worksheet,
  logoId: number,
  business: BusinessConfig,
  lastColumn: number,
  infoColumn: number
): void {
  const lines = businessHeaderLines(business)
  const heights = [30, 22, 22, 22]

  lines.forEach((line, index) => {
    const rowNumber = index + 1
    if (infoColumn < lastColumn) {
      sheet.mergeCells(rowNumber, infoColumn, rowNumber, lastColumn)
    }
    const cell = sheet.getCell(rowNumber, infoColumn)
    cell.value = line
    cell.font = {
      bold: index === 0,
      size: index === 0 ? 16 : 9,
      color: { argb: index === 0 ? 'FF17365D' : 'FF526579' }
    }
    cell.alignment = { vertical: 'middle', wrapText: true }
    sheet.getRow(rowNumber).height = heights[index]
  })

  sheet.addImage(logoId, {
    tl: { col: 0.1, row: 0.15 },
    ext: { width: 145, height: 78 }
  })
}

function valuationLabel(movement: KardexMovement): string {
  if (movement.valuationBasis === 'SALE_SNAPSHOT') return 'Costo histórico del ticket'
  if (movement.valuationBasis === 'PRODUCT_COST') return 'Costo de ficha (referencial)'
  return 'No disponible'
}

function createWorkbook(
  movements: KardexMovement[],
  query: KardexMovementQuery,
  business: BusinessConfig,
  logoBuffer: Buffer
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NovusPOS'
  workbook.subject = 'Kardex de movimientos de inventario'
  workbook.created = new Date()
  const logoId = workbook.addImage({
    base64: `data:image/png;base64,${logoBuffer.toString('base64')}`,
    extension: 'png'
  })

  const sheet = workbook.addWorksheet('Kardex', {
    properties: { tabColor: { argb: 'FF0067C0' } }
  })
  const columns = [
    { header: 'Fecha y hora', key: 'timestamp', width: 23 },
    { header: 'Referencia', key: 'reference', width: 20 },
    { header: 'Código', key: 'productCode', width: 18 },
    { header: 'Producto', key: 'productName', width: 32 },
    { header: 'Unidad', key: 'unit', width: 14 },
    { header: 'Origen', key: 'source', width: 20 },
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'Motivo', key: 'reason', width: 22 },
    { header: 'Lote', key: 'batchNumber', width: 24 },
    { header: 'Stock previo', key: 'previousStock', width: 15 },
    { header: 'Cantidad', key: 'quantity', width: 15 },
    { header: 'Stock final', key: 'newStock', width: 15 },
    { header: 'Costo unitario', key: 'unitCost', width: 19 },
    { header: 'Costo total', key: 'movementCost', width: 19 },
    { header: 'Responsable', key: 'responsibleUser', width: 22 },
    { header: 'Notas', key: 'notes', width: 40 },
    { header: 'Base de valoración', key: 'valuation', width: 30 }
  ]
  sheet.columns = columns.map(({ key, width }) => ({ key, width }))
  addExcelBusinessHeader(sheet, logoId, business, columns.length, 3)
  sheet.mergeCells(5, 1, 5, columns.length)
  sheet.getCell('A5').value = 'INFORME DE MOVIMIENTOS DE INVENTARIO'
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } }
  sheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  sheet.getCell('A5').alignment = { vertical: 'middle' }
  sheet.getRow(5).height = 32
  sheet.mergeCells(6, 1, 6, columns.length)
  sheet.getCell('A6').value =
    `Generado: ${new Date().toLocaleString('es-VE')}  |  Período: ${periodLabel(query.period)}  |  Tipo: ${typeLabel(query.type)}  |  Motivo: ${reasonLabel(query.reason)}  |  Búsqueda: ${query.search || 'Todas'}  |  Registros: ${movements.length}`
  sheet.getRow(6).height = 26
  sheet.getCell('A6').font = { size: 10, color: { argb: 'FF526579' } }
  sheet.getCell('A6').alignment = { vertical: 'middle', wrapText: true }
  sheet.getRow(7).values = [undefined, ...columns.map((column) => column.header)]
  const header = sheet.getRow(7)
  header.height = 28
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0067C0' } }
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF00A6A6' } } }
  })

  for (const movement of movements) {
    const parsedDate = new Date(movement.timestamp)
    const row = sheet.addRow({
      timestamp: Number.isNaN(parsedDate.getTime()) ? movement.timestamp : parsedDate,
      reference: movement.reference ?? '',
      productCode: movement.productCode,
      productName: movement.productName,
      unit: movement.unit ?? '',
      source: SOURCE_LABELS[movement.source],
      type: movement.type,
      reason: movement.reason.replace(/_/g, ' '),
      batchNumber: movement.batchNumber ?? '',
      previousStock: movement.previousStock,
      quantity: movement.quantity,
      newStock: movement.newStock,
      unitCost: movement.unitCost ?? null,
      movementCost: movement.unitCost === undefined ? null : movement.quantity * movement.unitCost,
      responsibleUser: movement.responsibleUser,
      notes: movement.notes ?? '',
      valuation: valuationLabel(movement)
    })
    row.getCell(13).numFmt = EXCEL_CURRENCY_FORMAT[movement.currency]
    row.getCell(14).numFmt = EXCEL_CURRENCY_FORMAT[movement.currency]
  }

  sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7, column: columns.length } }
  sheet.views = [{ state: 'frozen', ySplit: 7 }]
  sheet.getColumn(1).numFmt = 'dd/mm/yyyy hh:mm:ss'
  for (const column of [10, 11, 12]) sheet.getColumn(column).numFmt = '#,##0.###'
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 7) return
    row.height = 22
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowNumber % 2 === 0 ? 'FFF2F6FA' : 'FFFFFFFF' }
      }
      cell.font = { size: 9, color: { argb: 'FF263445' } }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD9E2F0' } } }
    })
  })

  const summary = workbook.addWorksheet('Resumen')
  summary.columns = [{ width: 28 }, { width: 60 }]
  addExcelBusinessHeader(summary, logoId, business, 2, 2)
  summary.mergeCells('A5:B5')
  summary.getCell('A5').value = 'RESUMEN DEL KARDEX'
  summary.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } }
  summary.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  summary.getCell('A5').alignment = { vertical: 'middle' }
  summary.getRow(5).height = 32
  summary.addRows([
    ['Período', periodLabel(query.period)],
    ['Tipo', typeLabel(query.type)],
    ['Motivo', reasonLabel(query.reason)],
    ['Búsqueda', query.search || 'Todas'],
    ['Fecha de exportación', new Date()],
    ['Movimientos incluidos', movements.length],
    ['Productos afectados', new Set(movements.map((movement) => movement.productId)).size],
    ['Valorización', 'Moneda de origen del movimiento; total = cantidad × costo unitario']
  ])
  summary.getCell('B10').numFmt = 'dd/mm/yyyy hh:mm'
  summary.eachRow((row, rowNumber) => {
    if (rowNumber <= 5) return
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FA' } }
      cell.font = { size: 10, color: { argb: 'FF263445' } }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9E2F0' } } }
    })
  })

  return workbook
}

function createPdfHtml(
  movements: KardexMovement[],
  query: KardexMovementQuery,
  business: BusinessConfig,
  logoBuffer: Buffer
): string {
  const [companyName, fiscalDetails, address, contact] = businessHeaderLines(business)
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
  const rows = movements
    .map(
      (movement) => `<tr>
        <td>${escapeHtml(formatTimestamp(movement.timestamp))}</td>
        <td>${escapeHtml(movement.reference ?? '—')}</td>
        <td>${escapeHtml(movement.productCode)}</td>
        <td>${escapeHtml(movement.productName)}</td>
        <td>${escapeHtml(movement.unit ?? '—')}</td>
        <td>${escapeHtml(SOURCE_LABELS[movement.source])}</td>
        <td>${escapeHtml(movement.type)} / ${escapeHtml(movement.reason.replace(/_/g, ' '))}</td>
        <td>${escapeHtml(movement.batchNumber ?? '—')}</td>
        <td class="number">${escapeHtml(formatQuantity(movement.previousStock))}</td>
        <td class="number">${escapeHtml(formatQuantity(movement.quantity))}</td>
        <td class="number">${escapeHtml(formatQuantity(movement.newStock))}</td>
        <td class="number">${escapeHtml(formatMoney(movement.unitCost, movement.currency))}</td>
        <td class="number">${escapeHtml(
          formatMoney(
            movement.unitCost === undefined ? undefined : movement.quantity * movement.unitCost,
            movement.currency
          )
        )}</td>
        <td>${escapeHtml(movement.responsibleUser)}</td>
        <td>${escapeHtml(movement.notes ?? '—')}</td>
        <td>${escapeHtml(valuationLabel(movement))}</td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
    <html lang="es"><head><meta charset="utf-8"><style>
      @page { size: A3 landscape; margin: 8mm; }
      * { box-sizing: border-box; }
      body { color: #1b1b1b; font-family: Arial, sans-serif; margin: 0; }
      .business-header { align-items: center; border-bottom: 1.5pt solid #17365d; display: flex; gap: 7mm; margin-bottom: 4mm; padding-bottom: 3mm; }
      .business-header img { height: 20mm; max-width: 42mm; object-fit: contain; }
      .business-info { min-width: 0; }
      .business-name { color: #17365d; font-size: 16pt; font-weight: 700; margin-bottom: 1mm; }
      .business-detail { color: #526579; font-size: 8pt; line-height: 1.45; overflow-wrap: anywhere; }
      h1 { color: #17365d; font-size: 13pt; margin: 0 0 2mm; }
      .meta { color: #526579; font-size: 7.5pt; line-height: 1.45; margin-bottom: 4mm; }
      .meta strong { color: #263445; }
      table { border-collapse: collapse; table-layout: fixed; width: 100%; }
      thead { display: table-header-group; }
      th { background: #17365d; color: white; font-size: 6.5pt; }
      td { font-size: 6pt; }
      th, td { border: 0.3pt solid #d9e2f0; overflow-wrap: anywhere; padding: 2mm 1mm; vertical-align: top; }
      tbody tr:nth-child(even) { background: #f2f6fa; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      .number { text-align: right; white-space: nowrap; }
      .empty { color: #717783; padding: 10mm; text-align: center; }
      footer { color: #717783; font-size: 7pt; margin-top: 4mm; text-align: right; }
    </style></head><body>
      <header class="business-header">
        <img src="${logoDataUrl}" alt="Logo NovusPOS">
        <div class="business-info">
          <div class="business-name">${escapeHtml(companyName)}</div>
          <div class="business-detail">${escapeHtml(fiscalDetails)}</div>
          <div class="business-detail">${escapeHtml(address)}</div>
          <div class="business-detail">${escapeHtml(contact)}</div>
        </div>
      </header>
      <h1>INFORME DE MOVIMIENTOS DE INVENTARIO</h1>
      <div class="meta">
        <strong>Generado:</strong> ${escapeHtml(new Date().toLocaleString('es-VE'))} &nbsp;·&nbsp;
        <strong>Período:</strong> ${escapeHtml(periodLabel(query.period))} &nbsp;·&nbsp;
        <strong>Tipo:</strong> ${escapeHtml(typeLabel(query.type))} &nbsp;·&nbsp;
        <strong>Motivo:</strong> ${escapeHtml(reasonLabel(query.reason))}<br>
        <strong>Búsqueda:</strong> ${escapeHtml(query.search || 'Todas')} &nbsp;·&nbsp;
        <strong>Movimientos:</strong> ${movements.length} &nbsp;·&nbsp;
        <strong>Valoración:</strong> moneda de origen de cada movimiento, costo total = cantidad × costo unitario
      </div>
      <table><thead><tr>
        <th>Fecha</th><th>Referencia</th><th>Código</th><th>Producto</th><th>Unidad</th>
        <th>Origen</th><th>Tipo / motivo</th><th>Lote</th><th>Stock previo</th><th>Cantidad</th>
        <th>Stock final</th><th>Costo unitario</th><th>Costo total</th><th>Responsable</th>
        <th>Notas</th><th>Base de valoración</th>
      </tr></thead><tbody>
        ${rows || '<tr><td class="empty" colspan="16">No hay movimientos que coincidan con los filtros.</td></tr>'}
      </tbody></table>
      <footer>Historial de movimientos · NovusPOS</footer>
    </body></html>`
}

function createPdfWindow(): BrowserWindow {
  const parent = BrowserWindow.getFocusedWindow()
  return new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(parent ? { parent } : {}),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  })
}

export class KardexExporter {
  async export(
    movements: KardexMovement[],
    query: KardexMovementQuery,
    format: KardexExportFormat,
    business: BusinessConfig
  ): Promise<boolean> {
    if (format !== 'XLSX' && format !== 'PDF') {
      throw new Error('El formato de exportación no es válido.')
    }

    const extension = format === 'XLSX' ? 'xlsx' : 'pdf'
    const options = {
      title: 'Exportar Kardex',
      defaultPath: `novuspos_kardex_${new Date().toISOString().slice(0, 10)}.${extension}`,
      filters: [
        { name: format === 'XLSX' ? 'Libro de Excel' : 'Documento PDF', extensions: [extension] }
      ]
    }
    const parent = BrowserWindow.getFocusedWindow()
    const result = parent
      ? await dialog.showSaveDialog(parent, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return false

    const filePath = result.filePath.toLowerCase().endsWith(`.${extension}`)
      ? result.filePath
      : `${result.filePath}.${extension}`
    const logoPath = app.isPackaged
      ? join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'logobanner.png')
      : join(app.getAppPath(), 'resources', 'logobanner.png')
    const logoBuffer = await readFile(logoPath)

    if (format === 'XLSX') {
      const workbook = createWorkbook(movements, query, business, logoBuffer)
      const buffer = await workbook.xlsx.writeBuffer()
      await writeFile(filePath, new Uint8Array(buffer))
      return true
    }

    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'novuspos-kardex-'))
    let pdfWindow: BrowserWindow | null = null
    try {
      pdfWindow = createPdfWindow()
      await writeFile(
        join(temporaryDirectory, 'report.html'),
        createPdfHtml(movements, query, business, logoBuffer),
        'utf8'
      )
      await pdfWindow.loadFile(join(temporaryDirectory, 'report.html'))
      const pdf = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
        pageSize: 'A3',
        landscape: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      })
      await writeFile(filePath, new Uint8Array(pdf))
      return true
    } finally {
      if (pdfWindow && !pdfWindow.isDestroyed()) pdfWindow.close()
      await rm(temporaryDirectory, { recursive: true, force: true })
    }
  }
}
