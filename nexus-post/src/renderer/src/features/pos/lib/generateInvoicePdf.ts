import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import bwipjs from 'bwip-js'
import type { CartItem, PaymentDetails } from '../../../shared/types/domain'
import type { BusinessConfig, CurrencyVesExchangeRate, Customer } from '@shared/contracts'
import { formatCurrency, formatVesAmount } from '../../../shared/lib/currency'
import { formatProductQuantity } from '@shared/lib/product-quantity'
import { formatTaxLabel } from '@shared/lib/tax'
import { formatBusinessAddress } from '../../../shared/lib/businessConfig'

export interface InvoicePdfData {
  business: BusinessConfig
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  taxBreakdown: Array<{ taxId?: string; taxName: string; taxRate: number; amount: number }>
  payment?: PaymentDetails
  ticketNumber: string
  cashierName: string
  customer?: Customer | null
  customerDisplayName?: string
  exchangeRate: CurrencyVesExchangeRate | null
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta Débito/Crédito',
  transfer: 'Transferencia Bancaria',
  pago_movil: 'Pago Móvil',
  mixed: 'Pago Mixto',
  credit: 'Crédito',
  zelle: 'Zelle',
  crypto: 'Criptomoneda'
}

/**
 * Genera un documento PDF profesional tamaño Carta (Letter) con jsPDF y jspdf-autotable.
 * Produce un PDF vectorial nítido, sin distorsiones ni artefactos de HTML.
 */
export function buildLetterInvoicePdf(data: InvoicePdfData): jsPDF {
  const {
    business,
    items,
    subtotal,
    tax,
    discount,
    total,
    taxBreakdown,
    payment,
    ticketNumber,
    cashierName,
    customer,
    customerDisplayName,
    exchangeRate
  } = data

  const doc = new jsPDF({
    unit: 'mm',
    format: 'letter',
    orientation: 'portrait'
  })

  const pageWidth = 215.9
  const pageHeight = 279.4
  const marginX = 14
  const contentWidth = pageWidth - marginX * 2 // 187.9 mm

  const now = new Date()
  const invoiceDate = now.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const invoiceTime = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  const clientName = (customer?.name || customerDisplayName || 'CLIENTE DE CONTADO').toUpperCase()

  // 1. Barra superior decorativa
  doc.setFillColor(30, 58, 138) // Azul Corporativo #1E3A8A
  doc.rect(marginX, 10, contentWidth, 2.5, 'F')

  // 2. Información de la Empresa (Izquierda)
  let currentY = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  const legalName = (business.legalName || 'EMPRESA COMERCIAL C.A.').toUpperCase()
  doc.text(legalName, marginX, currentY)

  if (business.tradeName) {
    currentY += 4.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(2, 132, 199) // #0284C7
    doc.text(business.tradeName, marginX, currentY)
  }

  if (business.taxId && business.taxIdType !== 'NONE') {
    currentY += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(`${business.taxIdType || 'RIF'}: ${business.taxId}`, marginX, currentY)
  }

  const fullAddress = formatBusinessAddress(business)
  if (fullAddress) {
    currentY += 3.8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    const addressLines = doc.splitTextToSize(fullAddress, 115)
    doc.text(addressLines, marginX, currentY)
    currentY += addressLines.length * 3.2
  }

  const contacts: string[] = []
  if (business.phone) contacts.push(`Tel: ${business.phone}`)
  if (business.email) contacts.push(`Email: ${business.email}`)
  if (contacts.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(contacts.join('   |   '), marginX, currentY)
  }

  // 3. Recuadro de Factura / Control (Derecha)
  const boxX = 138
  const boxY = 16
  const boxW = contentWidth - (boxX - marginX)
  const boxH = 28

  doc.setFillColor(240, 247, 255)
  doc.setDrawColor(30, 58, 138)
  doc.setLineWidth(0.4)
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(30, 58, 138)
  doc.text('FACTURA / NOTA DE ENTREGA', boxX + boxW / 2, boxY + 5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.text(`#${ticketNumber}`, boxX + boxW / 2, boxY + 12, { align: 'center' })

  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.line(boxX + 4, boxY + 15, boxX + boxW - 4, boxY + 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Fecha: ${invoiceDate}`, boxX + 5, boxY + 20)
  doc.text(`Hora: ${invoiceTime}`, boxX + boxW - 5, boxY + 20, { align: 'right' })

  if (business.ticketShowCashier) {
    doc.text(`Cajero: ${cashierName || 'Principal'}`, boxX + 5, boxY + 24.5)
  }

  // 4. Recuadro de Datos del Cliente
  const custBoxY = Math.max(currentY + 5, boxY + boxH + 4)
  const custBoxH = customer?.address ? 21 : 16

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, custBoxY, contentWidth, custBoxH, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(30, 58, 138)
  doc.text('DATOS DEL CLIENTE / RECEPTOR', marginX + 4, custBoxY + 4.5)

  doc.setDrawColor(226, 232, 240)
  doc.line(marginX + 4, custBoxY + 6, marginX + contentWidth - 4, custBoxY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Nombre / Razón Social:', marginX + 4, custBoxY + 10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(clientName, marginX + 36, custBoxY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Cédula / RIF:', marginX + 120, custBoxY + 10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(customer?.taxId || 'V-00000000', marginX + 140, custBoxY + 10)

  if (customer?.phone || customer?.email) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('Teléfono:', marginX + 4, custBoxY + 14.5)
    doc.setTextColor(30, 41, 59)
    doc.text(customer?.phone || 'No registrado', marginX + 18, custBoxY + 14.5)

    if (customer?.email) {
      doc.setTextColor(100, 116, 139)
      doc.text('Email:', marginX + 65, custBoxY + 14.5)
      doc.setTextColor(30, 41, 59)
      doc.text(customer.email, marginX + 76, custBoxY + 14.5)
    }
  }

  if (customer?.address) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('Dirección:', marginX + 4, custBoxY + 18.5)
    doc.setTextColor(30, 41, 59)
    doc.text(customer.address, marginX + 20, custBoxY + 18.5)
  }

  // 5. Tabla de Productos (jspdf-autotable)
  const tableBody = items.map((item, index) => {
    const lineTotal =
      item.product.salePrice * item.quantity * (1 - item.discountPercent / 100)
    return [
      String(index + 1),
      item.product.code || '—',
      item.product.name,
      `${formatProductQuantity(item.quantity)} ${item.product.unit || 'UND'}`,
      formatCurrency(item.product.salePrice, business.currency),
      item.discountPercent > 0 ? `-${item.discountPercent}%` : '—',
      formatCurrency(lineTotal, business.currency)
    ]
  })

  autoTable(doc, {
    startY: custBoxY + custBoxH + 4,
    margin: { left: marginX, right: marginX },
    head: [['#', 'CÓDIGO', 'DESCRIPCIÓN DEL PRODUCTO', 'CANT.', 'P. UNIT.', 'DESC.', 'TOTAL']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'left' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [30, 58, 138] }
    }
  })

  // @ts-ignore
  let finalY: number = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : 160

  // Si la tabla terminó muy abajo, añadir una página para no sobrecargar los totales
  if (finalY > 215) {
    doc.addPage()
    finalY = 16
  }

  // 6. Resumen de Totales y Forma de Pago
  const summaryLeftW = 100
  const summaryRightW = 75
  const rightX = marginX + contentWidth - summaryRightW

  // Recuadro izquierdo: Forma de Pago y Notas Legales
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(marginX, finalY, summaryLeftW, 25, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(30, 58, 138)
  doc.text('FORMA DE PAGO:', marginX + 4, finalY + 5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  const methodLabel = payment ? (PAYMENT_LABELS[payment.method] || payment.method.toUpperCase()) : 'CONTADO'
  doc.text(methodLabel, marginX + 32, finalY + 5)

  if (payment && payment.method === 'cash') {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('Monto Entregado:', marginX + 4, finalY + 10)
    doc.setTextColor(30, 41, 59)
    doc.text(formatCurrency(payment.amountPaid, business.currency), marginX + 32, finalY + 10)

    doc.setTextColor(22, 163, 74)
    doc.setFont('helvetica', 'bold')
    doc.text('Cambio / Vuelto:', marginX + 4, finalY + 14.5)
    doc.text(formatCurrency(payment.change, business.currency), marginX + 32, finalY + 14.5)
  }

  if (business.ticketLegalNote) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6.5)
    doc.setTextColor(148, 163, 184)
    const legalLines = doc.splitTextToSize(business.ticketLegalNote, summaryLeftW - 8)
    doc.text(legalLines, marginX + 4, finalY + 19.5)
  }

  // Recuadro derecho: Totales
  let currentTotY = finalY

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('Subtotal:', rightX, currentTotY + 4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(formatCurrency(subtotal, business.currency), rightX + summaryRightW, currentTotY + 4, {
    align: 'right'
  })

  // Descuentos
  if (discount > 0) {
    currentTotY += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(22, 163, 74)
    doc.text('Descuentos:', rightX, currentTotY + 4)
    doc.setFont('helvetica', 'bold')
    doc.text(`-${formatCurrency(discount, business.currency)}`, rightX + summaryRightW, currentTotY + 4, {
      align: 'right'
    })
  }

  // Impuestos
  if (business.taxEnabled) {
    const activeTaxes = taxBreakdown.filter((l) => l.taxRate > 0)
    if (activeTaxes.length > 0) {
      for (const t of activeTaxes) {
        currentTotY += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        doc.text(`${formatTaxLabel(t.taxName, t.taxRate)}:`, rightX, currentTotY + 4)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 41, 59)
        doc.text(formatCurrency(t.amount, business.currency), rightX + summaryRightW, currentTotY + 4, {
          align: 'right'
        })
      }
    } else if (tax > 0) {
      currentTotY += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text(`${business.taxName} (${business.taxRate}%):`, rightX, currentTotY + 4)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(formatCurrency(tax, business.currency), rightX + summaryRightW, currentTotY + 4, {
        align: 'right'
      })
    }
  }

  // Banner Total
  currentTotY += 6
  doc.setFillColor(30, 58, 138)
  doc.roundedRect(rightX, currentTotY, summaryRightW, 9, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL A PAGAR:', rightX + 4, currentTotY + 6)
  doc.setFontSize(10.5)
  doc.text(formatCurrency(total, business.currency), rightX + summaryRightW - 4, currentTotY + 6, {
    align: 'right'
  })

  // Referencia BCV (VES)
  if (business.currency !== 'VES' && exchangeRate) {
    currentTotY += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('Ref. BCV (VES):', rightX, currentTotY + 3)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text(formatVesAmount(total * exchangeRate.rate), rightX + summaryRightW, currentTotY + 3, {
      align: 'right'
    })
  }

  // 7. Firmas de Entrega y Recepción
  const sigY = Math.max(finalY + 32, currentTotY + 12)
  const sigW = 60

  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.line(marginX + 15, sigY + 12, marginX + 15 + sigW, sigY + 12)
  doc.line(rightX + 5, sigY + 12, rightX + 5 + sigW, sigY + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(71, 85, 105)
  doc.text('ENTREGADO POR (FIRMA / SELLO)', marginX + 15 + sigW / 2, sigY + 16, { align: 'center' })
  doc.text('RECIBIDO CONFORME (CLIENTE)', rightX + 5 + sigW / 2, sigY + 16, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(cashierName ? `Cajero: ${cashierName}` : 'Despachado', marginX + 15 + sigW / 2, sigY + 19.5, {
    align: 'center'
  })
  doc.text(clientName, rightX + 5 + sigW / 2, sigY + 19.5, { align: 'center' })

  // 8. Pie de Página
  const footY = pageHeight - 12
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  doc.line(marginX, footY - 3, marginX + contentWidth, footY - 3)

  if (business.ticketFooter) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(business.ticketFooter, marginX + contentWidth / 2, footY, { align: 'center' })
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  doc.text(`NexusPOS • Emitido el ${invoiceDate} ${invoiceTime}`, marginX, footY + 4)
  doc.text('Página 1 de 1', marginX + contentWidth, footY + 4, { align: 'right' })

  return doc
}

/**
 * Renderiza un código de barras Code 128 vectorial real en el documento jsPDF
 * utilizando las dimensiones exactas generadas por bwip-js.
 */
function renderBarcodeToPdf(
  doc: jsPDF,
  text: string,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number
): void {
  try {
    const cleanText = text.trim()
    const svg = bwipjs.toSVG({
      bcid: 'code128',
      text: cleanText,
      height: 10,
      includetext: false
    })

    const vbMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/)
    if (!vbMatch) return
    const origWidth = parseFloat(vbMatch[1])
    const scaleX = targetWidth / origWidth

    const pathRegex = /<path stroke="#000000" stroke-width="(\d+)" d="([^"]+)"/g
    let match: RegExpExecArray | null
    doc.setFillColor(0, 0, 0)

    while ((match = pathRegex.exec(svg)) !== null) {
      const strokeW = parseFloat(match[1]) * scaleX
      const d = match[2]
      const commands = d.split('M').filter(Boolean)
      for (const cmd of commands) {
        const parts = cmd.trim().split(' ')
        const barX = parseFloat(parts[0]) * scaleX
        doc.rect(targetX + barX - strokeW / 2, targetY, strokeW, targetHeight, 'F')
      }
    }
  } catch {
    // Respaldo elegante con barras proporcionales si el texto tiene caracteres incompatibles
    doc.setFillColor(0, 0, 0)
    const lineCount = 38
    const step = targetWidth / lineCount
    for (let i = 0; i < lineCount; i++) {
      if (i % 2 === 0 || i % 5 === 0) {
        const w = i % 3 === 0 ? step * 0.7 : step * 0.35
        doc.rect(targetX + i * step, targetY, w, targetHeight, 'F')
      }
    }
  }
}

/**
 * Genera un documento PDF para Ticket Térmico en formato continuo de 80mm o 58mm.
 * Produce un PDF proporcional sin márgenes excesivos, ideal para negocios sin impresora
 * térmica o que deseen archivar/enviar el ticket digital exacto.
 */
export function buildThermalTicketPdf(data: InvoicePdfData, widthMm: 80 | 58 = 80): jsPDF {
  const {
    business,
    items,
    subtotal,
    tax,
    discount,
    total,
    taxBreakdown,
    payment,
    ticketNumber,
    cashierName,
    customer,
    customerDisplayName,
    exchangeRate
  } = data

  const is58 = widthMm === 58
  const marginX = is58 ? 3 : 4
  const contentWidth = widthMm - marginX * 2
  const scale = is58 ? 0.85 : 1

  const now = new Date()
  const invoiceDate = now.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const invoiceTime = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  const clientName = (customer?.name || customerDisplayName || 'CLIENTE').toUpperCase()

  // Calcular altura dinámica estimada para que el ticket quepa en una sola tira continua
  let estimatedHeight = 90
  if (business.ticketHeader) estimatedHeight += 6
  if (business.tradeName) estimatedHeight += 5
  if (business.ticketShowTaxId && business.taxId) estimatedHeight += 5
  if (business.ticketShowAddress) estimatedHeight += 14
  if (business.ticketLegalNote) estimatedHeight += 12
  if (business.ticketFooter) estimatedHeight += 8
  if (discount > 0) estimatedHeight += 5
  if (business.currency !== 'VES' && exchangeRate) estimatedHeight += 5
  if (payment?.method === 'cash') estimatedHeight += 8

  for (const item of items) {
    estimatedHeight += is58 ? 13 : 11
  }

  const doc = new jsPDF({
    unit: 'mm',
    format: [widthMm, Math.max(145, Math.ceil(estimatedHeight))],
    orientation: 'portrait'
  })

  let y = 6

  // 1. Encabezado del negocio
  if (business.ticketHeader) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7 * scale)
    doc.setTextColor(100, 116, 139)
    doc.text(business.ticketHeader, widthMm / 2, y, { align: 'center' })
    y += 3.8
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5 * scale)
  doc.setTextColor(15, 23, 42)
  const legalName = (business.legalName || 'NEXUSPOS').toUpperCase()
  doc.text(legalName, widthMm / 2, y, { align: 'center' })
  y += 4

  if (business.tradeName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8 * scale)
    doc.setTextColor(2, 132, 199)
    doc.text(business.tradeName, widthMm / 2, y, { align: 'center' })
    y += 3.5
  }

  if (business.ticketShowTaxId && business.taxId && business.taxIdType !== 'NONE') {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5 * scale)
    doc.setTextColor(71, 85, 105)
    doc.text(`${business.taxIdType || 'RIF'}: ${business.taxId}`, widthMm / 2, y, { align: 'center' })
    y += 3.2
  }

  if (business.ticketShowAddress) {
    const fullAddress = formatBusinessAddress(business)
    if (fullAddress) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7 * scale)
      doc.setTextColor(100, 116, 139)
      const addrLines = doc.splitTextToSize(fullAddress, contentWidth)
      doc.text(addrLines, widthMm / 2, y, { align: 'center' })
      y += addrLines.length * 3.2
    }

    if (business.phone) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7 * scale)
      doc.setTextColor(100, 116, 139)
      doc.text(`Tel: ${business.phone}`, widthMm / 2, y, { align: 'center' })
      y += 3.5
    }
  }

  const drawDashedLine = (currY: number): void => {
    doc.setLineDashPattern([1, 1], 0)
    doc.setLineWidth(0.2)
    doc.setDrawColor(180, 180, 180)
    doc.line(marginX, currY, widthMm - marginX, currY)
  }

  drawDashedLine(y)
  y += 3.5

  // 2. Datos del Ticket
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8 * scale)
  doc.setTextColor(15, 23, 42)
  doc.text(`TICKET #${ticketNumber}`, marginX, y)
  doc.text('CAJA 01', widthMm - marginX, y, { align: 'right' })
  y += 3.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7 * scale)
  doc.setTextColor(100, 116, 139)
  doc.text(`Fecha: ${invoiceDate}  ${invoiceTime}`, marginX, y)
  y += 3.2

  if (business.ticketShowCashier) {
    doc.text(`Cajero: ${cashierName || 'Principal'}`, marginX, y)
    y += 3.2
  }

  if (clientName) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    const clientTax = customer?.taxId ? ` (${customer.taxId})` : ''
    const clientText = doc.splitTextToSize(`Cliente: ${clientName}${clientTax}`, contentWidth)
    doc.text(clientText, marginX, y)
    y += clientText.length * 3.2 + 0.8
  }

  drawDashedLine(y)
  y += 3.5

  // 3. Encabezado de columnas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7 * scale)
  doc.setTextColor(15, 23, 42)
  doc.text('CANT  DESCRIPCIÓN', marginX, y)
  doc.text('TOTAL', widthMm - marginX, y, { align: 'right' })
  y += 3.2

  drawDashedLine(y)
  y += 3.5

  // 4. Lista de artículos
  for (const item of items) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5 * scale)
    doc.setTextColor(15, 23, 42)
    const nameLines = doc.splitTextToSize(item.product.name, contentWidth - (is58 ? 16 : 22))
    doc.text(nameLines, marginX, y)

    const lineTotal =
      item.product.salePrice * item.quantity * (1 - item.discountPercent / 100)
    doc.text(formatCurrency(lineTotal, business.currency), widthMm - marginX, y, { align: 'right' })
    y += nameLines.length * (3.2 * scale)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5 * scale)
    doc.setTextColor(100, 116, 139)
    const qtyUnit = `${formatProductQuantity(item.quantity)} ${item.product.unit || 'UND'}`
    const priceStr = formatCurrency(item.product.salePrice, business.currency)
    const discStr = item.discountPercent > 0 ? ` (-${item.discountPercent}%)` : ''
    doc.text(`${qtyUnit} x ${priceStr}${discStr}`, marginX, y)
    y += 3.5 * scale
  }

  y += 1
  drawDashedLine(y)
  y += 3.5

  // 5. Totales
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5 * scale)
  doc.setTextColor(71, 85, 105)

  doc.text('Subtotal:', marginX, y)
  doc.text(formatCurrency(subtotal, business.currency), widthMm - marginX, y, { align: 'right' })
  y += 3.5

  if (discount > 0) {
    doc.setTextColor(22, 163, 74)
    doc.text('Descuentos:', marginX, y)
    doc.text(`-${formatCurrency(discount, business.currency)}`, widthMm - marginX, y, { align: 'right' })
    y += 3.5
    doc.setTextColor(71, 85, 105)
  }

  if (business.taxEnabled) {
    const activeTaxes = taxBreakdown.filter((l) => l.taxRate > 0)
    if (activeTaxes.length > 0) {
      for (const t of activeTaxes) {
        doc.text(`${formatTaxLabel(t.taxName, t.taxRate)}:`, marginX, y)
        doc.text(formatCurrency(t.amount, business.currency), widthMm - marginX, y, { align: 'right' })
        y += 3.5
      }
    } else if (tax > 0) {
      doc.text(`${business.taxName} (${business.taxRate}%):`, marginX, y)
      doc.text(formatCurrency(tax, business.currency), widthMm - marginX, y, { align: 'right' })
      y += 3.5
    }
  }

  doc.setLineDashPattern([], 0)
  doc.setLineWidth(0.3)
  doc.setDrawColor(15, 23, 42)
  doc.line(marginX, y - 0.5, widthMm - marginX, y - 0.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9 * scale)
  doc.setTextColor(15, 23, 42)
  doc.text('TOTAL A PAGAR:', marginX, y + 3)
  doc.text(formatCurrency(total, business.currency), widthMm - marginX, y + 3, { align: 'right' })
  y += 7.5

  if (business.currency !== 'VES' && exchangeRate) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7 * scale)
    doc.setTextColor(100, 116, 139)
    doc.text('Ref. BCV (VES):', marginX, y)
    doc.setFont('helvetica', 'bold')
    doc.text(formatVesAmount(total * exchangeRate.rate), widthMm - marginX, y, { align: 'right' })
    y += 4
  }

  drawDashedLine(y)
  y += 3.5

  // 6. Pago
  if (payment) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7 * scale)
    doc.setTextColor(71, 85, 105)
    doc.text('Método de Pago:', marginX, y)
    doc.setFont('helvetica', 'bold')
    const pm = PAYMENT_LABELS[payment.method] || payment.method.toUpperCase()
    doc.text(pm, widthMm - marginX, y, { align: 'right' })
    y += 3.5

    if (payment.method === 'cash') {
      doc.setFont('helvetica', 'normal')
      doc.text('Efectivo Recibido:', marginX, y)
      doc.text(formatCurrency(payment.amountPaid, business.currency), widthMm - marginX, y, { align: 'right' })
      y += 3.5

      doc.setTextColor(22, 163, 74)
      doc.setFont('helvetica', 'bold')
      doc.text('Cambio Entregado:', marginX, y)
      doc.text(formatCurrency(payment.change, business.currency), widthMm - marginX, y, { align: 'right' })
      y += 4.5
      doc.setTextColor(71, 85, 105)
    }

    drawDashedLine(y)
    y += 3.5
  }

  // 7. Código de barras profesional Code 128
  const barW = is58 ? 36 : 46
  const barH = is58 ? 7 : 8.5
  const barStartX = (widthMm - barW) / 2
  renderBarcodeToPdf(doc, ticketNumber, barStartX, y, barW, barH)
  y += barH + 2.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5 * scale)
  doc.setTextColor(100, 116, 139)
  doc.text(`*${ticketNumber}*`, widthMm / 2, y, { align: 'center' })
  y += 3.5

  // 8. Pie de ticket y Nota Legal
  if (business.ticketFooter) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7 * scale)
    doc.setTextColor(71, 85, 105)
    const footerLines = doc.splitTextToSize(business.ticketFooter, contentWidth)
    doc.text(footerLines, widthMm / 2, y, { align: 'center' })
    y += footerLines.length * 3.2 + 0.5
  }

  if (business.ticketLegalNote) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6 * scale)
    doc.setTextColor(148, 163, 184)
    const legalLines = doc.splitTextToSize(business.ticketLegalNote, contentWidth)
    doc.text(legalLines, widthMm / 2, y, { align: 'center' })
    y += legalLines.length * 2.8 + 2
  }

  return doc
}

/**
 * Genera el documento PDF según el formato de papel configurado en el negocio.
 */
export function buildInvoicePdf(
  data: InvoicePdfData,
  paperSize: 'LETTER_PDF' | 'TICKET_80MM' | 'TICKET_58MM' = 'LETTER_PDF'
): jsPDF {
  if (paperSize === 'TICKET_80MM') return buildThermalTicketPdf(data, 80)
  if (paperSize === 'TICKET_58MM') return buildThermalTicketPdf(data, 58)
  return buildLetterInvoicePdf(data)
}

/**
 * Descarga directamente el archivo PDF de la factura/ticket en el formato seleccionado.
 */
export function downloadInvoicePdf(
  data: InvoicePdfData,
  paperSize: 'LETTER_PDF' | 'TICKET_80MM' | 'TICKET_58MM' = 'LETTER_PDF',
  customFileName?: string
): void {
  const doc = buildInvoicePdf(data, paperSize)
  const safeNumber = data.ticketNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  const prefix = paperSize === 'LETTER_PDF' ? 'Factura' : 'Ticket'
  const sizeSuffix =
    paperSize === 'TICKET_58MM' ? '-58mm' : paperSize === 'TICKET_80MM' ? '-80mm' : ''
  const fileName = customFileName || `${prefix}-${safeNumber}${sizeSuffix}.pdf`
  doc.save(fileName)
}

/**
 * Imprime el PDF generado con jsPDF creando un Blob URL y enviándolo al motor de impresión nativo.
 */
export function printInvoicePdf(
  data: InvoicePdfData,
  paperSize: 'LETTER_PDF' | 'TICKET_80MM' | 'TICKET_58MM' = 'LETTER_PDF'
): void {
  const doc = buildInvoicePdf(data, paperSize)
  const blob = doc.output('blob')
  const blobUrl = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = blobUrl

  document.body.appendChild(iframe)

  iframe.onload = (): void => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      window.open(blobUrl, '_blank')
    } finally {
      setTimeout(() => {
        try {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(blobUrl)
        } catch {
          // ignore
        }
      }, 60000)
    }
  }
}

/**
 * Descarga directamente el archivo PDF de la factura generado con jsPDF (compatibilidad).
 */
export function downloadLetterInvoicePdf(data: InvoicePdfData, customFileName?: string): void {
  downloadInvoicePdf(data, 'LETTER_PDF', customFileName)
}

/**
 * Imprime el PDF generado con jsPDF (compatibilidad).
 */
export function printLetterInvoicePdf(data: InvoicePdfData): void {
  printInvoicePdf(data, 'LETTER_PDF')
}
