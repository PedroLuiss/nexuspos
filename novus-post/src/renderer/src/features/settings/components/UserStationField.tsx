import React from 'react'

interface UserStationFieldProps {
  station: string
  onChange: (station: string) => void
}

export function UserStationField({ station, onChange }: UserStationFieldProps): React.JSX.Element {
  return (
    <div>
      <label htmlFor="user-station" className="mb-1 block text-xs font-medium text-slate-700">
        Nombre de la caja <span className="text-red-500">*</span>
      </label>
      <input
        id="user-station"
        type="text"
        required
        maxLength={80}
        value={station}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ej. Caja Principal"
        className="w-full rounded-[4px] border border-slate-300 bg-white px-3 py-1.5 focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
      />
      <p className="mt-1 text-[10px] text-slate-500">
        Se mostrará en el encabezado y quedará asociada a sus turnos y transacciones.
      </p>
    </div>
  )
}
