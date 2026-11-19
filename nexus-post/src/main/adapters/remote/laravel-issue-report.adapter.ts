import { API_CONFIG } from '@shared/config/api.config'
import type { IssueReportInput, IssueReportResult } from '@shared/contracts'
import type { IssueReportPort } from '../../ports/issue-report.port'

interface LaravelIssueReportResponse {
  success?: boolean
  status?: string
  message?: string
}

export class LaravelIssueReportAdapter implements IssueReportPort {
  async submit(input: IssueReportInput): Promise<IssueReportResult> {
    const url = new URL(
      `${API_CONFIG.baseUrl.replace(/\/+$/, '')}${API_CONFIG.endpoints.issueReports}`
    )
    const isLocalDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalDevelopmentHost)) {
      return {
        success: false,
        error: 'La API de reportes debe usar HTTPS fuera del equipo local.'
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: input.title,
          category: input.category,
          description: input.description,
          contact_email: input.contactEmail ?? null
        }),
        signal: controller.signal
      })

      const payload = (await response.json().catch(() => null)) as LaravelIssueReportResponse | null

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'El servicio de reportes aún no está disponible en el servidor.'
          }
        }

        return {
          success: false,
          error:
            (typeof payload?.message === 'string' && payload.message) ||
            `No se pudo enviar el reporte (HTTP ${response.status}).`
        }
      }

      if (payload?.success !== true && payload?.status !== 'success') {
        return {
          success: false,
          error: 'El servidor respondió, pero no confirmó el registro del reporte.'
        }
      }

      return {
        success: true,
        message:
          (typeof payload?.message === 'string' && payload.message) ||
          'Tu reporte fue enviado correctamente.'
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Se agotó el tiempo de espera al enviar el reporte. Intenta nuevamente.'
        }
      }

      return {
        success: false,
        error:
          'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.'
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
