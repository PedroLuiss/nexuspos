import React from 'react'

interface SettingsDataErrorsProps {
  businessError: string | null
  scaleError: string | null
  onRetryBusiness: () => void
}

export function SettingsDataErrors({
  businessError,
  scaleError,
  onRetryBusiness
}: SettingsDataErrorsProps): React.JSX.Element | null {
  if (!businessError && !scaleError) return null

  return (
    <>
      {businessError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          <span>No se pudo leer la configuración guardada: {businessError}</span>
          <button
            type="button"
            onClick={onRetryBusiness}
            className="shrink-0 rounded border border-red-300 bg-white px-2.5 py-1 font-semibold hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}
      {scaleError && (
        <div
          role="alert"
          className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          No se pudo consultar la configuración de báscula: {scaleError}
        </div>
      )}
    </>
  )
}
