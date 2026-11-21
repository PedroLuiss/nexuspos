import React, { useState } from 'react'
import type { BusinessConfigInput } from '@shared/contracts'
import {
  Mail,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info
} from '../../../shared/icons/Icons'
import { settingsApi } from '../api/settings.api'

interface EmailSmtpConfigSectionProps {
  values: BusinessConfigInput
  onChange: (patch: Partial<BusinessConfigInput>) => void
  disabled?: boolean
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'
const labelClass = 'block text-[11px] font-semibold text-slate-700 mb-1'

export const EmailSmtpConfigSection: React.FC<EmailSmtpConfigSectionProps> = ({
  values,
  onChange,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const isEnabled = Boolean(values.emailInvoiceEnabled)

  const handleTestSmtp = async (): Promise<void> => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await settingsApi.testSmtp({
        host: values.smtpHost || 'smtp.gmail.com',
        port: Number(values.smtpPort) || 587,
        secure: Boolean(values.smtpSecure),
        user: values.smtpUser || '',
        password: values.smtpPassword || ''
      })
      setTestResult(res)
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error desconocido al probar SMTP.'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Activador principal */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={disabled}
            checked={isEnabled}
            onChange={(e) => onChange({ emailInvoiceEnabled: e.target.checked })}
            className="mt-0.5 rounded border-slate-300 text-[#0067C0] focus:ring-[#0067C0]"
          />
          <div>
            <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Mail size={14} className="text-[#0067C0]" />
              Enviar facturas automáticamente por Correo Electrónico
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Si la venta tiene un cliente registrado con correo, el sistema enviará el comprobante digital al concretar la venta o bajo demanda.
            </span>
          </div>
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-4 p-4 bg-white border border-slate-200 rounded-md">
          {/* Instrucciones Google SMTP Gratuito */}
          <div className="flex gap-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded text-blue-950 text-[11px]">
            <Info size={16} className="text-[#0078D4] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Configuración recomendada con Gmail SMTP Gratuito:</span>
              <p className="text-slate-700 leading-relaxed">
                Utilice su cuenta de Google con una <strong>Contraseña de Aplicación de 16 caracteres</strong> (Genérela en:{' '}
                <em>Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones</em>). No use su contraseña normal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Servidor SMTP (Host)</label>
              <input
                type="text"
                disabled={disabled}
                value={values.smtpHost || ''}
                onChange={(e) => onChange({ smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Puerto SMTP</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={values.smtpPort || 587}
                  onChange={(e) => onChange({ smtpPort: Number(e.target.value) || 587 })}
                  placeholder="587"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Conexión Segura</label>
                <select
                  disabled={disabled}
                  value={values.smtpSecure ? 'ssl' : 'tls'}
                  onChange={(e) => onChange({ smtpSecure: e.target.value === 'ssl' })}
                  className={inputClass}
                >
                  <option value="tls">STARTTLS (587)</option>
                  <option value="ssl">SSL / TLS (465)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Usuario / Correo Electrónico (Gmail)</label>
              <input
                type="email"
                disabled={disabled}
                value={values.smtpUser || ''}
                onChange={(e) => onChange({ smtpUser: e.target.value })}
                placeholder="tunegocio@gmail.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Contraseña de Aplicación Google (16 caracteres)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={disabled}
                  value={values.smtpPassword || ''}
                  onChange={(e) => onChange({ smtpPassword: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className={`${inputClass} pr-8`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Nombre Visible del Remitente</label>
            <input
              type="text"
              disabled={disabled}
              value={values.smtpFromName || ''}
              onChange={(e) => onChange({ smtpFromName: e.target.value })}
              placeholder={values.tradeName || values.legalName || 'Ferretería El Tornillo C.A.'}
              className={inputClass}
            />
          </div>

          {/* Plantillas de correo */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className={labelClass}>
                Asunto del Correo{' '}
                <span className="font-normal text-slate-400">
                  (Variables: {'{numero}'}, {'{empresa}'})
                </span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={values.emailSubjectTemplate || ''}
                onChange={(e) => onChange({ emailSubjectTemplate: e.target.value })}
                placeholder="Factura #{numero} - {empresa}"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Cuerpo del Correo{' '}
                <span className="font-normal text-slate-400">
                  (Variables: {'{cliente}'}, {'{numero}'}, {'{total}'}, {'{empresa}'})
                </span>
              </label>
              <textarea
                rows={3}
                disabled={disabled}
                value={values.emailBodyTemplate || ''}
                onChange={(e) => onChange({ emailBodyTemplate: e.target.value })}
                placeholder="Estimado/a {cliente}, le adjuntamos su factura..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Botón de prueba y estado */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              disabled={disabled || testing || !values.smtpUser || !values.smtpPassword}
              onClick={handleTestSmtp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0067C0] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{testing ? 'Comprobando conexión…' : 'Probar Conexión SMTP'}</span>
            </button>

            {testResult && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailSmtpConfigSection
