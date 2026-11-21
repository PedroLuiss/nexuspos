import React from 'react'
import { Scale } from '../../../shared/icons/Icons'
import SettingsCard from './SettingsCard'

export interface ScaleConfigView {
  comPort: string
  baudRate: number
  isEnabled: boolean
  isConnected: boolean
}

interface ScaleSettingsCardProps {
  isAdmin: boolean
  config: ScaleConfigView
  error: string | null
  onOpen: () => void
}

export function ScaleSettingsCard({
  isAdmin,
  config,
  error,
  onOpen
}: ScaleSettingsCardProps): React.JSX.Element {
  return (
    <SettingsCard
      icon={<Scale size={22} />}
      title="Báscula y Puerto Serial (RS-232)"
      subtitle="Comunicación COM por hardware"
      accent="amber"
      badge={{
        label: error ? 'No disponible' : config.isConnected ? 'Conectado' : 'Desconectado',
        className: error
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : config.isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
      }}
      description="Conexión para balanzas de peso comercial mediante puerto serial; transmite el peso al POS."
      facts={[
        { label: 'Puerto COM:', value: error ? '—' : config.comPort, valueClassName: 'font-mono' },
        {
          label: 'Baud Rate:',
          value: error ? '—' : `${config.baudRate} bps`,
          valueClassName: 'font-mono'
        },
        {
          label: 'Estado de Enlace:',
          value: error ? 'No disponible' : config.isConnected ? 'Conectado' : 'Desconectado',
          valueClassName: error
            ? 'text-amber-700 font-mono'
            : config.isConnected
              ? 'text-[#107C41] font-mono'
              : 'text-slate-500 font-mono'
        }
      ]}
      footerNote={
        error ? 'Error al consultar' : config.isEnabled ? 'Habilitada en POS' : 'Deshabilitada'
      }
      actionLabel="Configurar Puerto Serial"
      onAction={onOpen}
      disabled={!isAdmin}
      disabledHint={isAdmin ? undefined : 'Solo Administrador'}
    />
  )
}
