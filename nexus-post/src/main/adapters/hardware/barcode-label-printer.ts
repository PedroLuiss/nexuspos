import { BrowserWindow, dialog } from 'electron'
import bwipjs from 'bwip-js/node'
import type { BarcodeFormat } from '@shared/contracts'
import { getProductBarcodeValidationError } from '@shared/lib/product-barcode'

export interface BarcodeLabelContent {
  productCode: string
  productName: string
  salePrice: number
  barcode: string
  format: BarcodeFormat
  copies: number
  widthMm: number
  heightMm: number
  marginMm: number
  includePrice: boolean
}

const BWIP_FORMAT: Record<BarcodeFormat, string> = {
  'EAN-13': 'ean13',
  'EAN-8': 'ean8',
  'UPC-A': 'upca',
  Code128: 'code128',
  Code39: 'code39',
  'ITF-14': 'itf14',
  OTRO: 'code128'
}

function validateLabelContent(content: BarcodeLabelContent): void {
  if (!content.barcode.trim()) throw new Error('El producto no tiene un código de barras válido.')
  if (!Number.isInteger(content.copies) || content.copies < 1 || content.copies > 500) {
    throw new Error('La cantidad debe ser un número entero entre 1 y 500.')
  }
  if (!Number.isFinite(content.widthMm) || content.widthMm < 20 || content.widthMm > 100) {
    throw new Error('El ancho de etiqueta debe estar entre 20 y 100 mm.')
  }
  if (!Number.isFinite(content.heightMm) || content.heightMm < 10 || content.heightMm > 100) {
    throw new Error('El alto de etiqueta debe estar entre 10 y 100 mm.')
  }
  if (
    !Number.isFinite(content.marginMm) ||
    content.marginMm < 0 ||
    content.marginMm * 2 >= Math.min(content.widthMm, content.heightMm)
  ) {
    throw new Error('El margen no cabe dentro del tamaño de etiqueta seleccionado.')
  }
  if (!Number.isFinite(content.salePrice) || content.salePrice < 0) {
    throw new Error('El precio del producto no es válido para la etiqueta.')
  }
}

function createBarcodeSvg(barcode: string, format: BarcodeFormat): string {
  const value = barcode.trim()
  const validationError = getProductBarcodeValidationError(value, format)
  if (validationError) throw new Error(validationError)

  return bwipjs.toSVG({
    bcid: BWIP_FORMAT[format],
    text: value,
    scale: 2,
    height: 12,
    includetext: true,
    textxalign: 'center',
    textsize: 10,
    padding: 0,
    backgroundcolor: 'FFFFFF'
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function createLabelHtml(content: BarcodeLabelContent): string {
  validateLabelContent(content)
  const barcode = content.barcode.trim()
  const barcodeData = Buffer.from(createBarcodeSvg(barcode, content.format)).toString(
    'base64'
  )
  const productName = escapeHtml(content.productName)
  const productCode = escapeHtml(barcode)
  const price = content.salePrice.toFixed(2)
  const labels = Array.from({ length: content.copies }, (_, index) => {
    const priceElement = content.includePrice
      ? `<div class="price">$${price}</div>`
      : ''
    return `<article class="label${index === content.copies - 1 ? ' last' : ''}">
      <div class="name">${productName}</div>
      <img class="barcode" src="data:image/svg+xml;base64,${barcodeData}" alt="Código ${productCode}">
      ${priceElement}
    </article>`
  }).join('')

  return `<!doctype html>
    <html><head><meta charset="utf-8"><style>
      @page { size: ${content.widthMm}mm ${content.heightMm}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; color: #111; }
      .label {
        width: ${content.widthMm}mm; height: ${content.heightMm}mm;
        padding: ${content.marginMm}mm; display: flex; flex-direction: column;
        align-items: center; justify-content: space-between; overflow: hidden;
        page-break-after: always; break-after: page;
      }
      .label.last { page-break-after: auto; break-after: auto; }
      .name { width: 100%; max-height: 25%; overflow: hidden; text-align: center;
        font-size: 9pt; font-weight: 700; line-height: 1.15; }
      .barcode { display: block; width: 100%; height: auto; max-height: 62%;
        object-fit: contain; }
      .price { font-size: 10pt; font-weight: 700; line-height: 1; }
    </style></head><body>${labels}</body></html>`
}

function pageSize(content: BarcodeLabelContent): { width: number; height: number } {
  return {
    width: Math.round(content.widthMm * 1000),
    height: Math.round(content.heightMm * 1000)
  }
}

function createPrintWindow(show: boolean): BrowserWindow {
  const parent = BrowserWindow.getFocusedWindow()
  return new BrowserWindow({
    width: 700,
    height: 520,
    show,
    autoHideMenuBar: true,
    ...(parent ? { parent } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
}

export class BarcodeLabelPrinter {
  preview(barcode: string, format: BarcodeFormat): string {
    return createBarcodeSvg(barcode.trim(), format)
  }

  async print(content: BarcodeLabelContent): Promise<void> {
    const printWindow = createPrintWindow(true)
    try {
      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(createLabelHtml(content))}`
      )
      await new Promise<void>((resolve, reject) => {
        printWindow.webContents.print(
          { silent: false, printBackground: true, pageSize: pageSize(content) },
          (success, failureReason) => {
            if (success) resolve()
            else reject(new Error(failureReason || 'La impresión fue cancelada o falló.'))
          }
        )
      })
    } finally {
      if (!printWindow.isDestroyed()) printWindow.close()
    }
  }

  async downloadPdf(content: BarcodeLabelContent): Promise<boolean> {
    const html = createLabelHtml(content)
    const parent = BrowserWindow.getFocusedWindow()
    const saveOptions = {
      title: 'Guardar etiquetas en PDF',
      defaultPath: `etiquetas-${content.productCode.replace(/[^a-z0-9_-]/gi, '_')}.pdf`,
      filters: [{ name: 'Documento PDF', extensions: ['pdf'] }]
    }
    const result = parent
      ? await dialog.showSaveDialog(parent, saveOptions)
      : await dialog.showSaveDialog(saveOptions)
    if (result.canceled || !result.filePath) return false

    const pdfWindow = createPrintWindow(false)
    try {
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdf = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
        pageSize: pageSize(content),
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      })
      const { writeFile } = await import('node:fs/promises')
      const filePath = result.filePath.toLowerCase().endsWith('.pdf')
        ? result.filePath
        : `${result.filePath}.pdf`
      await writeFile(filePath, pdf)
      return true
    } finally {
      if (!pdfWindow.isDestroyed()) pdfWindow.close()
    }
  }
}
