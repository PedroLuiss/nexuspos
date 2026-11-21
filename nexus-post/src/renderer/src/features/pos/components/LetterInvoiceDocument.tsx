import React from 'react'
import type { CartItem, PaymentDetails } from '../../../shared/types/domain'
import type { BusinessConfig, CurrencyVesExchangeRate, Customer } from '@shared/contracts'
import { formatBusinessAddress } from '../../../shared/lib/businessConfig'
import { formatCurrency, formatVesAmount } from '../../../shared/lib/currency'
import { formatProductQuantity } from '@shared/lib/product-quantity'
import { formatTaxLabel } from '@shared/lib/tax'

interface LetterInvoiceDocumentProps {
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

// ─── Paleta de colores profesional ─────────────────────────────────────────
const C = {
  primary: '#1a3c6e',      // azul oscuro corporativo
  accent: '#2563eb',       // azul medio para acentos
  accentLight: '#eff6ff',  // fondo azul muy suave
  border: '#d1d5db',       // gris borde
  borderDark: '#1a3c6e',   // borde primario
  text: '#111827',         // texto principal
  muted: '#6b7280',        // texto secundario
  mutedLight: '#9ca3af',   // texto terciario
  bg: '#f9fafb',           // fondo suave
  white: '#ffffff',
  green: '#15803d',        // descuento / positivo
  row1: '#ffffff',
  row2: '#f8fafc',
} as const

// ─── Estilos de celda de tabla ──────────────────────────────────────────────
const tdBase: React.CSSProperties = {
  padding: '7px 10px',
  fontSize: '11px',
  color: C.text,
  borderBottom: `1px solid ${C.border}`,
  verticalAlign: 'top',
}

export const LetterInvoiceDocument: React.FC<LetterInvoiceDocumentProps> = ({
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
  exchangeRate,
}) => {
  const now = new Date()
  const invoiceDate = now.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const invoiceTime = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  const clientName = customer?.name || customerDisplayName || 'CLIENTE DE CONTADO'
  const hasVes = business.currency !== 'VES'

  const paymentLabel: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta de Crédito/Débito',
    transfer: 'Transferencia Bancaria',
    pago_movil: 'Pago Móvil',
    mixed: 'Pago Mixto',
    credit: 'Crédito',
    zelle: 'Zelle',
    crypto: 'Criptomoneda',
  }

  return (
    // ID especial para los estilos de impresión
    <div
      id="letter-invoice-print"
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: C.white,
        fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        color: C.text,
        fontSize: '12px',
        lineHeight: '1.5',
        padding: '14mm 16mm 10mm 16mm',
        boxSizing: 'border-box',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* ── FRANJA DE COLOR SUPERIOR ─────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '7px',
          background: `linear-gradient(90deg, ${C.primary} 0%, ${C.accent} 100%)`,
        }}
      />

      {/* ── ENCABEZADO: EMPRESA + RECUADRO FACTURA ───────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '14px',
          marginBottom: '14px',
          borderBottom: `2px solid ${C.primary}`,
        }}
      >
        {/* Columna izquierda: datos empresa */}
        <div style={{ flex: 1, paddingRight: '20px' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: C.primary,
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              marginBottom: '3px',
              textTransform: 'uppercase',
            }}
          >
            {business.legalName || 'MI EMPRESA C.A.'}
          </div>

          {business.tradeName && (
            <div
              style={{ fontSize: '11px', color: C.accent, fontWeight: 600, marginBottom: '5px' }}
            >
              {business.tradeName}
            </div>
          )}

          {business.taxId && business.taxIdType !== 'NONE' && (
            <div style={{ fontSize: '11px', color: C.muted, fontWeight: 600, marginBottom: '2px' }}>
              {business.taxIdType || 'RIF'}: <strong style={{ color: C.text }}>{business.taxId}</strong>
            </div>
          )}

          {formatBusinessAddress(business) && (
            <div
              style={{
                fontSize: '10.5px',
                color: C.muted,
                lineHeight: 1.45,
                maxWidth: '340px',
                marginTop: '3px',
              }}
            >
              {formatBusinessAddress(business)}
            </div>
          )}

          {business.phone && (
            <div style={{ fontSize: '10.5px', color: C.muted, marginTop: '2px' }}>
              📞 {business.phone}
            </div>
          )}
          {business.email && (
            <div style={{ fontSize: '10.5px', color: C.muted }}>✉ {business.email}</div>
          )}
        </div>

        {/* Columna derecha: recuadro de número de factura */}
        <div
          style={{
            minWidth: '210px',
            backgroundColor: C.accentLight,
            border: `2px solid ${C.primary}`,
            borderRadius: '6px',
            padding: '12px 16px',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: C.primary,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            FACTURA / NOTA DE ENTREGA
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: C.primary,
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            #{ticketNumber}
          </div>
          <div
            style={{
              fontSize: '10.5px',
              color: C.muted,
              borderTop: `1px solid ${C.border}`,
              paddingTop: '6px',
            }}
          >
            <div>
              <strong>Fecha:</strong> {invoiceDate}
            </div>
            <div>
              <strong>Hora:</strong> {invoiceTime}
            </div>
            {business.ticketShowCashier && (
              <div>
                <strong>Cajero:</strong> {cashierName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DATOS DEL CLIENTE ─────────────────────────────────── */}
      <div
        style={{
          backgroundColor: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: '5px',
          padding: '10px 14px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            color: C.primary,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            paddingBottom: '5px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          DATOS DEL CLIENTE / RECEPTOR
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: '11px' }}>
          <div>
            <span style={{ color: C.muted, fontWeight: 600 }}>Nombre / Razón Social: </span>
            <span style={{ fontWeight: 700, color: C.text }}>{clientName}</span>
          </div>
          <div>
            <span style={{ color: C.muted, fontWeight: 600 }}>Cédula / RIF: </span>
            <span style={{ fontWeight: 600 }}>{customer?.taxId || 'V-00000000'}</span>
          </div>
          {customer?.phone && (
            <div>
              <span style={{ color: C.muted, fontWeight: 600 }}>Teléfono: </span>
              <span>{customer.phone}</span>
            </div>
          )}
          {customer?.email && (
            <div>
              <span style={{ color: C.muted, fontWeight: 600 }}>Correo: </span>
              <span>{customer.email}</span>
            </div>
          )}
          {customer?.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: C.muted, fontWeight: 600 }}>Dirección: </span>
              <span>{customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── TABLA DE PRODUCTOS ────────────────────────────────── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '16px',
          fontSize: '11px',
        }}
      >
        <thead>
          <tr
            style={{
              background: `linear-gradient(90deg, ${C.primary} 0%, #2552b0 100%)`,
              color: C.white,
            }}
          >
            <th style={{ ...thStyle, width: '32px', textAlign: 'center' }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>DESCRIPCIÓN DEL PRODUCTO / SERVICIO</th>
            <th style={{ ...thStyle, width: '70px', textAlign: 'center' }}>CANT.</th>
            <th style={{ ...thStyle, width: '90px', textAlign: 'right' }}>P. UNIT.</th>
            <th style={{ ...thStyle, width: '60px', textAlign: 'right' }}>DESC.</th>
            <th style={{ ...thStyle, width: '100px', textAlign: 'right' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const lineTotal =
              item.product.salePrice * item.quantity * (1 - item.discountPercent / 100)
            const isEven = index % 2 === 0
            return (
              <tr
                key={item.product.id}
                style={{ backgroundColor: isEven ? C.row1 : C.row2 }}
              >
                <td style={{ ...tdBase, textAlign: 'center', color: C.mutedLight, fontWeight: 600 }}>
                  {index + 1}
                </td>
                <td style={{ ...tdBase }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{item.product.name}</div>
                  {item.product.code && (
                    <div style={{ fontSize: '9.5px', color: C.mutedLight, marginTop: '1px' }}>
                      Cód: {item.product.code}
                    </div>
                  )}
                </td>
                <td style={{ ...tdBase, textAlign: 'center' }}>
                  <span style={{ fontWeight: 600 }}>
                    {formatProductQuantity(item.quantity)}
                  </span>
                  {' '}
                  <span style={{ color: C.muted, fontSize: '9.5px' }}>{item.product.unit}</span>
                </td>
                <td style={{ ...tdBase, textAlign: 'right', fontFamily: 'monospace' }}>
                  {formatCurrency(item.product.salePrice, business.currency)}
                </td>
                <td
                  style={{
                    ...tdBase,
                    textAlign: 'right',
                    color: item.discountPercent > 0 ? C.green : C.mutedLight,
                    fontWeight: item.discountPercent > 0 ? 700 : 400,
                  }}
                >
                  {item.discountPercent > 0 ? `-${item.discountPercent}%` : '—'}
                </td>
                <td
                  style={{
                    ...tdBase,
                    textAlign: 'right',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: C.primary,
                  }}
                >
                  {formatCurrency(lineTotal, business.currency)}
                </td>
              </tr>
            )
          })}
          {/* Fila vacía de relleno visual si pocos items */}
          {items.length < 4 &&
            Array.from({ length: 4 - items.length }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ backgroundColor: i % 2 === 0 ? C.row1 : C.row2 }}>
                <td colSpan={6} style={{ ...tdBase, height: '26px' }}>&nbsp;</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ── BLOQUE INFERIOR: FORMA DE PAGO + TOTALES ─────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          paddingTop: '12px',
          borderTop: `2px solid ${C.border}`,
        }}
      >
        {/* ─ Columna izquierda: Forma de pago + legales ─ */}
        <div style={{ flex: 1 }}>
          {payment && (
            <div
              style={{
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '5px',
                padding: '10px 14px',
                marginBottom: '12px',
                fontSize: '11px',
              }}
            >
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: C.primary,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                FORMA DE PAGO
              </div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: '12px', marginBottom: '4px' }}>
                {paymentLabel[payment.method] || payment.method.toUpperCase()}
              </div>
              {payment.method === 'cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
                    <span>Efectivo entregado:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {formatCurrency(payment.amountPaid, business.currency)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: C.green,
                      fontWeight: 700,
                    }}
                  >
                    <span>Vuelto / Cambio:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {formatCurrency(payment.change, business.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Leyenda legal */}
          {business.ticketLegalNote && (
            <div
              style={{
                fontSize: '9.5px',
                color: C.mutedLight,
                fontStyle: 'italic',
                lineHeight: 1.5,
                maxWidth: '320px',
              }}
            >
              {business.ticketLegalNote}
            </div>
          )}
        </div>

        {/* ─ Columna derecha: Tabla de totales ─ */}
        <div
          style={{
            minWidth: '240px',
            backgroundColor: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: '5px',
            overflow: 'hidden',
            fontSize: '11.5px',
          }}
        >
          {/* Subtotal */}
          <div style={totalRowStyle}>
            <span style={{ color: C.muted }}>Subtotal:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {formatCurrency(subtotal, business.currency)}
            </span>
          </div>

          {/* Descuentos */}
          {discount > 0 && (
            <div style={totalRowStyle}>
              <span style={{ color: C.green }}>Descuento:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.green }}>
                -{formatCurrency(discount, business.currency)}
              </span>
            </div>
          )}

          {/* Desglose de impuestos */}
          {business.taxEnabled &&
            taxBreakdown
              .filter((l) => l.taxRate > 0)
              .map((l) => (
                <div
                  key={`${l.taxId ?? l.taxName}-${l.taxRate}`}
                  style={totalRowStyle}
                >
                  <span style={{ color: C.muted }}>{formatTaxLabel(l.taxName, l.taxRate)}:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {formatCurrency(l.amount, business.currency)}
                  </span>
                </div>
              ))}
          {business.taxEnabled && taxBreakdown.every((l) => l.taxRate <= 0) && tax > 0 && (
            <div style={totalRowStyle}>
              <span style={{ color: C.muted }}>
                {business.taxName} ({business.taxRate}%):
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {formatCurrency(tax, business.currency)}
              </span>
            </div>
          )}

          {/* TOTAL */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: `linear-gradient(90deg, ${C.primary} 0%, #2552b0 100%)`,
              color: C.white,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.3px' }}>
              TOTAL A PAGAR
            </span>
            <span style={{ fontWeight: 900, fontSize: '15px', fontFamily: 'monospace' }}>
              {formatCurrency(total, business.currency)}
            </span>
          </div>

          {/* Equivalente en bolívares */}
          {hasVes && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 14px',
                fontSize: '10px',
                color: C.muted,
                backgroundColor: '#f1f5f9',
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <span>Ref. BCV (VES):</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {exchangeRate ? formatVesAmount(total * exchangeRate.rate) : 'No disponible'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── PIE DE PÁGINA / GRACIAS ───────────────────────────── */}
      {business.ticketFooter && (
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '11px',
            color: C.muted,
            fontStyle: 'italic',
            padding: '8px 0',
            borderTop: `1px dashed ${C.border}`,
          }}
        >
          {business.ticketFooter}
        </div>
      )}

      {/* ── FIRMAS ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '50px',
          marginTop: business.ticketFooter ? '24px' : '36px',
          paddingTop: '12px',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        {[
          { label: 'Autorizado / Firma del Vendedor', sub: cashierName },
          { label: 'Recibido Conforme (Cliente)', sub: clientName },
        ].map(({ label, sub }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div
              style={{
                height: '36px',
                borderBottom: `1px solid #9ca3af`,
                marginBottom: '6px',
              }}
            />
            <div style={{ fontSize: '9.5px', color: C.muted, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '9px', color: C.mutedLight, marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── NOTA AL PIE TÉCNICA ───────────────────────────────── */}
      <div
        style={{
          marginTop: '18px',
          textAlign: 'center',
          fontSize: '8.5px',
          color: C.mutedLight,
          letterSpacing: '0.3px',
        }}
      >
        Documento generado por NexusPOS · {invoiceDate} {invoiceTime} · #{ticketNumber}
      </div>
    </div>
  )
}

// ─── Estilos compartidos ────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: '9.5px',
  fontWeight: 700,
  letterSpacing: '0.8px',
  textTransform: 'uppercase' as const,
  color: '#ffffff',
}

const totalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 14px',
  borderBottom: '1px solid #e5e7eb',
}

export default LetterInvoiceDocument
