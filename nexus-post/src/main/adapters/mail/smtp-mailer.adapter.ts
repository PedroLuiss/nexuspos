import nodemailer from 'nodemailer'
import type { BusinessConfig, SendInvoiceEmailInput, TestSmtpInput } from '@shared/contracts'
import type { MailerPort } from '../../ports/mailer.port'

/**
 * Adaptador de envío de correos electrónicos vía SMTP.
 * Optimizado para cuentas de Google Gmail (smtp.gmail.com) con contraseñas de aplicación.
 */
export class SmtpMailerAdapter implements MailerPort {
  /**
   * Prueba de conexión y autenticación con el servidor SMTP.
   */
  async testConnection(config: TestSmtpInput): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.host || !config.user || !config.password) {
        return {
          success: false,
          message: 'Faltan parámetros requeridos: Servidor (Host), Usuario y Contraseña de aplicación.'
        }
      }

      const transporter = nodemailer.createTransport({
        host: config.host.trim(),
        port: config.port || 587,
        secure: Boolean(config.secure),
        auth: {
          user: config.user.trim(),
          pass: config.password.trim()
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      })

      await transporter.verify()

      return {
        success: true,
        message: '¡Conexión SMTP exitosa! El servidor aceptó las credenciales.'
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        message: `Error al conectar con el servidor SMTP: ${errorMsg}`
      }
    }
  }

  /**
   * Envía la factura emitida al correo del cliente.
   */
  async sendInvoiceMail(
    smtpConfig: BusinessConfig,
    input: SendInvoiceEmailInput
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!smtpConfig.emailInvoiceEnabled) {
        return {
          success: false,
          message: 'El envío de facturas por correo electrónico está desactivado en Ajustes.'
        }
      }

      if (!smtpConfig.smtpHost || !smtpConfig.smtpUser || !smtpConfig.smtpPassword) {
        return {
          success: false,
          message: 'La configuración SMTP de correo está incompleta (servidor, usuario o contraseña).'
        }
      }

      if (!input.toEmail || !input.toEmail.includes('@')) {
        return {
          success: false,
          message: 'La dirección de correo destinatario no es válida.'
        }
      }

      const transporter = nodemailer.createTransport({
        host: smtpConfig.smtpHost.trim(),
        port: smtpConfig.smtpPort || 587,
        secure: Boolean(smtpConfig.smtpSecure),
        auth: {
          user: smtpConfig.smtpUser.trim(),
          pass: smtpConfig.smtpPassword.trim()
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
      })

      const businessName = smtpConfig.tradeName || smtpConfig.legalName || 'NexusPOS'
      const clientName = input.customerName || 'Estimado Cliente'

      // Reemplazo de variables dinámicas en plantilla
      const replaceVars = (template: string): string =>
        template
          .replace(/\{cliente\}/gi, clientName)
          .replace(/\{numero\}/gi, input.invoiceNumber)
          .replace(/\{total\}/gi, input.totalFormatted)
          .replace(/\{empresa\}/gi, businessName)

      const subjectTemplate =
        input.customSubject || smtpConfig.emailSubjectTemplate || 'Factura #{numero} - {empresa}'
      const bodyTemplate =
        input.customBody ||
        smtpConfig.emailBodyTemplate ||
        'Estimado/a {cliente},\n\nAdjuntamos el comprobante de su compra por un total de {total}.\n\n¡Gracias por su preferencia!'

      const finalSubject = replaceVars(subjectTemplate)
      const finalBodyText = replaceVars(bodyTemplate)

      const fromDisplayName = smtpConfig.smtpFromName || businessName
      const fromAddress = `"${fromDisplayName}" <${smtpConfig.smtpUser.trim()}>`

      const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = []
      if (input.pdfBase64) {
        const cleanBase64 = input.pdfBase64.replace(/^data:application\/pdf;base64,/, '')
        attachments.push({
          filename: input.pdfFileName || `Factura-${input.invoiceNumber}.pdf`,
          content: Buffer.from(cleanBase64, 'base64'),
          contentType: 'application/pdf'
        })
      }

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; border-bottom: 2px solid #0078D4; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #0078D4; margin: 0;">${businessName}</h2>
            ${smtpConfig.taxId ? `<p style="margin: 4px 0 0; color: #666; font-size: 13px;">${smtpConfig.taxIdType}: ${smtpConfig.taxId}</p>` : ''}
          </div>
          <div style="white-space: pre-wrap; margin-bottom: 20px; font-size: 14px;">
            ${finalBodyText}
          </div>
          ${
            input.itemsSummary && input.itemsSummary.length > 0
              ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <thead>
                <tr style="background-color: #f5f5f5; border-bottom: 1px solid #ccc;">
                  <th style="text-align: left; padding: 8px;">Cant. y Producto</th>
                  <th style="text-align: right; padding: 8px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${input.itemsSummary
                  .map(
                    (it) => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${it.quantity} x ${it.description}</td>
                    <td style="padding: 8px; text-align: right;">${it.total}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : ''
          }
          <div style="text-align: right; margin-bottom: 20px;">
            <span style="font-size: 16px; font-weight: bold; color: #0078D4;">Total: ${input.totalFormatted}</span>
          </div>
          <div style="border-top: 1px dashed #ccc; padding-top: 12px; font-size: 11px; color: #777; text-align: center;">
            ${smtpConfig.ticketLegalNote || 'Comprobante digital emitido automáticamente por NexusPOS.'}
          </div>
        </div>
      `

      await transporter.sendMail({
        from: fromAddress,
        to: input.toEmail.trim(),
        subject: finalSubject,
        text: finalBodyText,
        html: htmlBody,
        attachments
      })

      return {
        success: true,
        message: `Factura enviada con éxito a ${input.toEmail.trim()}`
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        message: `Error al enviar correo electrónico: ${errorMsg}`
      }
    }
  }
}
