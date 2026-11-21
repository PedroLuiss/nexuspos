import React from 'react'
import type { BusinessConfigInput, CurrencyCode, TaxIdType } from '@shared/contracts'
import { CURRENCY_OPTIONS, TAX_ID_TYPE_OPTIONS } from '@shared/contracts'

interface BusinessIdentityFormProps {
  values: BusinessConfigInput
  onChange: (patch: Partial<BusinessConfigInput>) => void
  disabled?: boolean
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'
const labelClass = 'block text-[11px] font-semibold text-slate-700 mb-1'
const sectionTitleClass =
  'text-[11px] font-extrabold uppercase tracking-wide text-[#0067C0] border-b border-slate-200 pb-1'

/**
 * Datos legales, propietario, contacto y domicilio fiscal del establecimiento (Venezuela).
 */
export const BusinessIdentityForm: React.FC<BusinessIdentityFormProps> = ({
  values,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <section className="space-y-2.5">
        <h4 className={sectionTitleClass}>Identidad Legal</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={values.legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              placeholder="Ej. Comercial Los Andes C.A."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nombre Comercial</label>
            <input
              type="text"
              disabled={disabled}
              value={values.tradeName}
              onChange={(e) => onChange({ tradeName: e.target.value })}
              placeholder="Ej. Novus Market Venezuela"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Tipo de Documento</label>
            <select
              disabled={disabled}
              value={values.taxIdType || ''}
              onChange={(e) =>
                onChange({ taxIdType: (e.target.value as TaxIdType) || 'NONE' })
              }
              className={inputClass}
            >
              <option value="">Seleccionar tipo de documento…</option>
              {TAX_ID_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Al guardar un cambio se convierten los precios activos y saldos pendientes con tasas
              BCV vigentes. Los movimientos históricos conservan su moneda original; cierra todas
              las cajas y conecta a internet antes de cambiarla.
            </p>
          </div>
          <div>
            <label className={labelClass}>
              N.º de RIF{' '}
              {values.taxIdType !== 'NONE' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              disabled={disabled}
              value={values.taxId}
              onChange={(e) => onChange({ taxId: e.target.value })}
              placeholder="Ingrese RIF o identificación fiscal"
              className={`${inputClass} font-mono`}
              maxLength={10}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Identificación fiscal del SENIAT (máximo 10 caracteres).
            </p>
          </div>
          <div>
            <label className={labelClass}>Régimen Tributario</label>
            <input
              type="text"
              disabled={disabled}
              value={values.taxRegime}
              onChange={(e) => onChange({ taxRegime: e.target.value })}
              placeholder="Ej. Régimen General - Persona Jurídica"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <h4 className={sectionTitleClass}>Propietario / Representante Legal</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre del Propietario</label>
            <input
              type="text"
              disabled={disabled}
              value={values.ownerName}
              onChange={(e) => onChange({ ownerName: e.target.value })}
              placeholder="Ej. Carlos Morales"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Cédula del Propietario (CI / RIF)</label>
            <input
              type="text"
              disabled={disabled}
              value={values.ownerTaxId}
              onChange={(e) => onChange({ ownerTaxId: e.target.value.toUpperCase() })}
              placeholder="Ej. V-12345678"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <h4 className={sectionTitleClass}>Contacto</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Correo Electrónico</label>
            <input
              type="email"
              disabled={disabled}
              value={values.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="contacto@negocio.com.ve"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Sitio Web</label>
            <input
              type="text"
              disabled={disabled}
              value={values.website}
              onChange={(e) => onChange({ website: e.target.value })}
              placeholder="https://www.negocio.com.ve"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Teléfono Fijo</label>
            <input
              type="text"
              disabled={disabled}
              value={values.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+58 212-555.0199"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Celular / WhatsApp</label>
            <input
              type="text"
              disabled={disabled}
              value={values.mobile}
              onChange={(e) => onChange({ mobile: e.target.value })}
              placeholder="+58 412-555.0199"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Moneda de Operación</label>
            <select
              disabled={disabled}
              value={values.currency || ''}
              onChange={(e) =>
                onChange({ currency: (e.target.value as CurrencyCode) || 'VES' })
              }
              className={inputClass}
            >
              <option value="">Seleccionar moneda…</option>
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} — {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <h4 className={sectionTitleClass}>Domicilio Fiscal (Venezuela)</h4>
        <div>
          <label className={labelClass}>Dirección (avenida, calle y número)</label>
          <input
            type="text"
            disabled={disabled}
            value={values.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Ej. Av. Francisco Fajardo, Edificio Los Andes, Piso 1"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Distrito / Urbanización</label>
            <input
              type="text"
              disabled={disabled}
              value={values.district}
              onChange={(e) => onChange({ district: e.target.value })}
              placeholder="Ej. El Paraíso"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              type="text"
              disabled={disabled}
              value={values.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Ej. Caracas"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <input
              type="text"
              disabled={disabled}
              value={values.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="Ej. Distrito Capital"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Municipio</label>
            <input
              type="text"
              disabled={disabled}
              value={values.municipality}
              onChange={(e) => onChange({ municipality: e.target.value })}
              placeholder="Ej. Libertador"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Parroquia</label>
            <input
              type="text"
              disabled={disabled}
              value={values.parish}
              onChange={(e) => onChange({ parish: e.target.value })}
              placeholder="Ej. Altagracia"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>País</label>
            <input
              type="text"
              disabled={disabled}
              value={values.country}
              onChange={(e) => onChange({ country: e.target.value })}
              placeholder="Venezuela"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Código Postal</label>
            <input
              type="text"
              disabled={disabled}
              value={values.postalCode}
              onChange={(e) => onChange({ postalCode: e.target.value })}
              placeholder="Ej. 1010"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default BusinessIdentityForm
