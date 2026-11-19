import {
  ISSUE_REPORT_CATEGORIES,
  type IssueReportInput,
  type IssueReportResult
} from '@shared/contracts'
import type { IssueReportPort } from '../../ports/issue-report.port'
import type { AuthService } from '../auth/auth.service'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_TITLE_LENGTH = 5
const MAX_TITLE_LENGTH = 120
const MIN_DESCRIPTION_LENGTH = 20
const MAX_DESCRIPTION_LENGTH = 4000
const MAX_EMAIL_LENGTH = 160
const VALID_CATEGORIES: ReadonlySet<string> = new Set(ISSUE_REPORT_CATEGORIES)

export class IssueReportService {
  constructor(
    private readonly reporter: IssueReportPort,
    private readonly auth: AuthService
  ) {}

  async submit(input: IssueReportInput): Promise<IssueReportResult> {
    if (!this.auth.getSessionUser()) {
      return { success: false, error: 'Inicia sesión para enviar un reporte.' }
    }

    if (!input || typeof input !== 'object') {
      return { success: false, error: 'Los datos del reporte no son válidos.' }
    }

    const title = typeof input.title === 'string' ? input.title.trim() : ''
    const description = typeof input.description === 'string' ? input.description.trim() : ''
    const contactEmail =
      typeof input.contactEmail === 'string' ? input.contactEmail.trim().toLowerCase() : ''

    if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
      return {
        success: false,
        error: `El título debe tener entre ${MIN_TITLE_LENGTH} y ${MAX_TITLE_LENGTH} caracteres.`
      }
    }
    if (!VALID_CATEGORIES.has(input.category)) {
      return { success: false, error: 'Selecciona una categoría válida.' }
    }
    if (
      description.length < MIN_DESCRIPTION_LENGTH ||
      description.length > MAX_DESCRIPTION_LENGTH
    ) {
      return {
        success: false,
        error: `La descripción debe tener entre ${MIN_DESCRIPTION_LENGTH} y ${MAX_DESCRIPTION_LENGTH} caracteres.`
      }
    }
    if (contactEmail.length > MAX_EMAIL_LENGTH || (contactEmail && !EMAIL_RE.test(contactEmail))) {
      return { success: false, error: 'El correo de contacto no tiene un formato válido.' }
    }

    return this.reporter.submit({
      title,
      category: input.category,
      description,
      contactEmail: contactEmail || undefined
    })
  }
}
