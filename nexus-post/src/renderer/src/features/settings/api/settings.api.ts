import type {
  BusinessConfig,
  BusinessConfigInput,
  TestSmtpInput,
  SendInvoiceEmailInput
} from '@shared/contracts'
import { DEFAULT_BUSINESS_CONFIG } from '../../../shared/lib/businessConfig'

function cleanErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (!raw) return 'No se pudo cargar la configuración del negocio.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
}

/** Estado mutable para el preview web (fuera de Electron). */
let previewConfig: BusinessConfig = { ...DEFAULT_BUSINESS_CONFIG }

/**
 * Wrapper de `window.api.settings` con fallback en memoria para el preview de Vite.
 * En la aplicación real todo se persiste en la tabla `business_settings` de SQLite.
 */
export const settingsApi = {
  getBusiness: async (): Promise<BusinessConfig> => {
    if (window.api?.settings) return window.api.settings.getBusiness()
    return previewConfig
  },

  updateBusiness: async (input: BusinessConfigInput): Promise<BusinessConfig> => {
    if (window.api?.settings) return window.api.settings.updateBusiness(input)
    previewConfig = {
      ...previewConfig,
      ...input,
      updatedAt: new Date().toISOString()
    }
    return previewConfig
  },

  testSmtp: async (input: TestSmtpInput): Promise<{ success: boolean; message: string }> => {
    if (window.api?.settings?.testSmtp) return window.api.settings.testSmtp(input)
    return {
      success: true,
      message: 'Simulación: Conexión SMTP exitosa (Modo Preview).'
    }
  },

  sendInvoiceEmail: async (
    input: SendInvoiceEmailInput
  ): Promise<{ success: boolean; message: string }> => {
    if (window.api?.settings?.sendInvoiceEmail) return window.api.settings.sendInvoiceEmail(input)
    return {
      success: true,
      message: `Simulación: Factura enviada a ${input.toEmail} (Modo Preview).`
    }
  }
}

export { cleanErrorMessage as settingsErrorMessage }
