import React, { useEffect, useState } from 'react'
import type { IssueReportCategory, IssueReportInput } from '@shared/contracts'
import { AlertCircle, CheckCircle2, Send, WifiOff, X } from '../../../shared/icons/Icons'

interface IssueReportModalProps {
  onClose: () => void
}

const CATEGORY_LABELS: Record<IssueReportCategory, string> = {
  sales: 'Ventas',
  inventory: 'Productos e inventario',
  cash: 'Caja',
  customers: 'Clientes',
  reports: 'Reportes',
  settings: 'Ajustes',
  other: 'Otro'
}

const OFFLINE_MESSAGE =
  'Conéctate a internet para enviar el reporte. No se guardará en este equipo.'

export function IssueReportModal({ onClose }: IssueReportModalProps): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [category, setCategory] = useState<IssueReportCategory>('sales')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true)
    const handleOffline = (): void => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const submitReport = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!isOnline || !navigator.onLine) {
      setIsOnline(false)
      setError(OFFLINE_MESSAGE)
      return
    }

    setError(null)
    setIsSubmitting(true)
    const input: IssueReportInput = {
      category,
      title: title.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim() || undefined
    }

    try {
      const result = await window.api.issueReports.submit(input)
      if (!result.success) {
        setError(result.error || 'No se pudo enviar el reporte.')
        return
      }
      setSuccessMessage(result.message || 'Tu reporte fue enviado correctamente.')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo enviar el reporte.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-report-title"
        className="w-full max-w-xl overflow-hidden rounded-lg border border-[#D1D1D1] bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] px-5 py-4">
          <div>
            <h2 id="issue-report-title" className="text-sm font-bold text-[#1B1B1B]">
              Reportar un problema
            </h2>
            <p className="mt-1 text-xs text-[#5C5C5C]">
              Cuéntanos qué ocurrió para que podamos revisarlo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar formulario"
            className="rounded p-1 text-[#5C5C5C] transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {!isOnline && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900"
            >
              <WifiOff size={15} className="mt-0.5 shrink-0" />
              <span>{OFFLINE_MESSAGE}</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-[#C42B1C]"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={36} className="mx-auto text-[#107C41]" />
              <h3 className="mt-3 text-sm font-bold text-[#1B1B1B]">Reporte enviado</h3>
              <p className="mt-1 text-xs text-[#5C5C5C]">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={(event) => void submitReport(event)} className="space-y-4">
              <div>
                <label
                  htmlFor="issue-report-category"
                  className="mb-1.5 block text-xs font-semibold text-[#1B1B1B]"
                >
                  Área del problema
                </label>
                <select
                  id="issue-report-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as IssueReportCategory)}
                  className="w-full rounded border border-[#D1D1D1] bg-white px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="issue-report-title-input"
                  className="mb-1.5 block text-xs font-semibold text-[#1B1B1B]"
                >
                  Asunto
                </label>
                <input
                  id="issue-report-title-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  minLength={5}
                  maxLength={120}
                  placeholder="Resume el problema en pocas palabras"
                  className="w-full rounded border border-[#D1D1D1] px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                />
              </div>

              <div>
                <label
                  htmlFor="issue-report-description"
                  className="mb-1.5 block text-xs font-semibold text-[#1B1B1B]"
                >
                  Descripción
                </label>
                <textarea
                  id="issue-report-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  minLength={20}
                  maxLength={4000}
                  rows={5}
                  placeholder="Indica los pasos que realizaste y qué esperabas que ocurriera."
                  className="w-full resize-y rounded border border-[#D1D1D1] px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                />
                <div className="mt-1 text-right text-[10px] text-[#717783]">
                  {description.length}/4000
                </div>
              </div>

              <div>
                <label
                  htmlFor="issue-report-contact"
                  className="mb-1.5 block text-xs font-semibold text-[#1B1B1B]"
                >
                  Correo de contacto <span className="font-normal text-[#717783]">(opcional)</span>
                </label>
                <input
                  id="issue-report-contact"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  maxLength={160}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded border border-[#D1D1D1] px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                />
              </div>

              <p className="rounded bg-[#F5F7FA] px-3 py-2 text-[10px] leading-relaxed text-[#5C5C5C]">
                Se enviarán únicamente el área, asunto, descripción y correo opcional que
                proporciones. No se adjuntan datos del equipo ni información técnica.
              </p>

              <div className="flex justify-end gap-2 border-t border-[#E5E5E5] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded border border-[#D1D1D1] px-3 py-2 text-xs font-semibold text-[#1B1B1B] hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isOnline || isSubmitting}
                  className="flex items-center gap-2 rounded bg-[#0067C0] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#005A9E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} />
                  {isSubmitting ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          )}

          {successMessage && (
            <div className="flex justify-end border-t border-[#E5E5E5] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-[#0067C0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#005A9E]"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
