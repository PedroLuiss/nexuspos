import React from 'react'
import type { BaudRate, SerialPortInfo } from '@shared/contracts'

const BAUD_RATES: { value: BaudRate; label: string }[] = [
  { value: 4800, label: '4800 bps' },
  { value: 9600, label: '9600 bps (Estándar)' },
  { value: 19200, label: '19200 bps' },
  { value: 38400, label: '38400 bps' },
  { value: 57600, label: '57600 bps' },
  { value: 115200, label: '115200 bps' }
]

interface ScalePortSettingsFieldsProps {
  comPort: string
  baudRate: BaudRate
  availablePorts: SerialPortInfo[]
  isConnecting: boolean
  isConnected: boolean
  onPortChange: (comPort: string) => void
  onBaudRateChange: (baudRate: BaudRate) => void
  onRefreshPorts: () => void
}

export function ScalePortSettingsFields({
  comPort,
  baudRate,
  availablePorts,
  isConnecting,
  isConnected,
  onPortChange,
  onBaudRateChange,
  onRefreshPorts
}: ScalePortSettingsFieldsProps): React.JSX.Element {
  const portOptions =
    availablePorts.length > 0
      ? availablePorts.map((port) => ({
          value: port.path,
          label: `${port.path}${port.manufacturer ? ` - ${port.manufacturer}` : ''}`
        }))
      : ['COM3', 'COM1', 'COM2', 'COM4'].map((port) => ({ value: port, label: port }))

  return (
    <>
      <div className="space-y-2">
        <label className="block font-semibold text-[#1B1B1B]">Puerto COM</label>
        <div className="flex gap-2">
          <select
            value={comPort}
            onChange={(event) => onPortChange(event.target.value)}
            disabled={isConnecting || isConnected}
            className="flex-1 rounded-[4px] border border-[#D1D1D1] bg-white px-2.5 py-1.5 text-[#1B1B1B] disabled:bg-slate-50"
          >
            {portOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefreshPorts}
            disabled={isConnecting || isConnected}
            className="cursor-pointer rounded-[4px] border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Refrescar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-[#1B1B1B]">Velocidad (Baud Rate)</label>
        <select
          value={baudRate}
          onChange={(event) => onBaudRateChange(Number(event.target.value) as BaudRate)}
          disabled={isConnecting || isConnected}
          className="w-full rounded-[4px] border border-[#D1D1D1] bg-white px-2.5 py-1.5 text-[#1B1B1B] disabled:bg-slate-50"
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate.value} value={rate.value}>
              {rate.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
