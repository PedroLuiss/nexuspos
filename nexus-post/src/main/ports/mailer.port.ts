import type { BusinessConfig, SendInvoiceEmailInput, TestSmtpInput } from '@shared/contracts'

/**
 * Puerto de envío de correos electrónicos vía SMTP (p. ej. Google Gmail SMTP).
 * La implementación concreta vive en `main/adapters/mail/`.
 */
export interface MailerPort {
  testConnection(config: TestSmtpInput): Promise<{ success: boolean; message: string }>
  sendInvoiceMail(
    smtpConfig: BusinessConfig,
    input: SendInvoiceEmailInput
  ): Promise<{ success: boolean; message: string }>
}
