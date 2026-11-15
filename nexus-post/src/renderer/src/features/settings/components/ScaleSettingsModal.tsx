import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X } from '../../../shared/icons/Icons'
import type { SerialPortInfo, ScaleConfigInput, ScaleReading, ScaleConnectionStatus, BaudRate } from '@shared/contracts'

interface ScaleSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onFeedback: (msg: string) => void
}

const BAUD_RATES: { value: BaudRate; label: string }[] = [
  { value: 4800, label: '4800 bps' },
  { value: 9600, label: '9600 bps (Estándar)' },
  { value: 19200, label: '19200 bps' },
  { value: 38400, label: '38400 bps' },
  { value: 57600, label: '57600 bps' },
  { value: 115200, label: '115200 bps' }
]

export const ScaleSettingsModal: React.FC<ScaleSettingsModalProps> = ({
  isOpen,
  onClose,
  onFeedback
}) => {
  const [comPort, setComPort] = useState<string>('COM3')
  const [baudRate, setBaudRate] = useState<BaudRate>(9600)
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [scaleWeight, setScaleWeight] = useState<string>('0.000 KG')
  const [isStable, setIsStable] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const readIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar configuración guardada y puertos disponibles al abrir
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const loadConfig = async (): Promise<void> => {
      try {
        const config = await window.api.hardware.getScaleConfig()
        if (!cancelled) {
          if (config) {
            setComPort(config.comPort)
            setBaudRate(config.baudRate)
            setIsEnabled(config.isEnabled)
          }
          const status = await window.api.hardware.isConnected()
          setIsConnected(status.isConnected)
          if (status.comPort) setComPort(status.comPort)
          if (status.baudRate) setBaudRate(status.baudRate)
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Error cargando configuración')
        }
      }

      const refreshPorts = async (): Promise<void> => {
        try {
          const ports = await window.api.hardware.listPorts()
          if (!cancelled) setAvailablePorts(ports)
        } catch (err) {
          if (!cancelled) {
            setErrorMsg(err instanceof Error ? err.message : 'Error listando puertos')
          }
        }
      }
      refreshPorts()
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Leer peso en vivo si está conectado
  useEffect(() => {
    if (!isOpen || !isConnected) {
      if (readIntervalRef.current) {
        clearInterval(readIntervalRef.current)
        readIntervalRef.current = null
      }
      return
    }

    const readWeightLoop = async (): Promise<void> => {
      try {
        const reading = await window.api.hardware.readWeight()
        if (reading.error) {
          setErrorMsg(reading.error)
          setScaleWeight('Error')
          setIsStable(false)
        } else {
          setScaleWeight(`${reading.weightKg.toFixed(3)} KG`)
          setIsStable(reading.isStable)
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error leyendo peso')
        setScaleWeight('Error')
        setIsStable(false)
      }
    }

    readWeightLoop()
    readIntervalRef.current = setInterval(readWeightLoop, 1000)

    return () => {
      if (readIntervalRef.current) {
        clearInterval(readIntervalRef.current)
        readIntervalRef.current = null
      }
    }
  }, [isOpen, isConnected])

  const handleListPorts = async (): Promise<void> => {
    setErrorMsg(null)
    try {
      const ports = await window.api.hardware.listPorts()
      setAvailablePorts(ports)
      if (ports.length === 0) {
        setErrorMsg('No se detectaron puertos seriales disponibles')
      } else {
        onFeedback(`Se detectaron ${ports.length} puerto(s) serial(es)`)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error listando puertos')
    }
  }

  const handleConnect = async (): Promise<void> => {
    setErrorMsg(null)
    setIsConnecting(true)
    try {
      await window.api.hardware.openPort(comPort, baudRate)
      setIsConnected(true)
      setIsEnabled(true)
      onFeedback(`Báscula conectada en ${comPort} a ${baudRate} bps`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error conectando la báscula')
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    setErrorMsg(null)
    try {
      await window.api.hardware.closePort()
      setIsConnected(false)
      setIsEnabled(false)
      setScaleWeight('0.000 KG')
      setIsStable(false)
      onFeedback('Báscula desconectada')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconectando la báscula')
    }
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setErrorMsg(null)
    try {
      const input: ScaleConfigInput = {
        id: 'default',
        comPort,
        baudRate,
        isEnabled
      }
      await window.api.hardware.saveScaleConfig(input)
      onFeedback('Configuración de báscula guardada en SQLite')
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const portOptions = availablePorts.length > 0
    ? availablePorts.map((p) => ({ value: p.path, label: `${p.path}${p.manufacturer ? ` - ${p.manufacturer}` : ''}` }))
    : [{ value: 'COM3', label: 'COM3' }, { value: 'COM1', label: 'COM1' }, { value: 'COM2', label: 'COM2' }, { value: 'COM4', label: 'COM4' }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[90vh]">
        <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Configuración de Báscula (RS-232 / COM)
          </h3>
          <button onClick={onClose} className="text-[#5C5C5C] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[60vh]">
          {errorMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-[4px] text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block font-semibold text-[#1B1B1B]">Puerto COM</label>
            <div className="flex gap-2">
              <select
                value={comPort}
                onChange={(e) => setComPort(e.target.value as string)}
                disabled={isConnecting || isConnected}
                className="flex-1 px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] disabled:bg-slate-50"
              >
                {portOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleListPorts}
                disabled={isConnecting || isConnected}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Refrescar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-[#1B1B1B]">Velocidad (Baud Rate)</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value) as BaudRate)}
              disabled={isConnecting || isConnected}
              className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] disabled:bg-slate-50"
            >
              {BAUD_RATES.map((rate) => (
                <option key={rate.value} value={rate.value}>
                  {rate.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                disabled={isConnecting || isConnected}
                className="rounded border-[#D1D1D1] text-[#0067C0] focus:ring-[#0067C0]"
              />
              <span className="text-[#1B1B1B]">Habilitar báscula en el POS</span>
            </label>
          </div>

          {/* Estado de conexión */}
          <div className={`p-3 rounded-[4px] border ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span>Puerto: {comPort}</span>
              <span>{baudRate} bps</span>
            </div>
          </div>

          {/* Lectura de peso en vivo */}
          {isConnected && (
            <div className="space-y-2">
              <label className="block font-semibold text-[#1B1B1B]">Peso en Vivo</label>
              <div className="p-4 bg-slate-900 rounded-[4px] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block tracking-widest uppercase mb-1">
                  Pantalla Digital de Balanza
                </span>
                <div className={`text-3xl font-extrabold tracking-wider my-1 ${isStable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {scaleWeight}
                </div>
                <span className={`text-[10px] ${isStable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isStable ? 'Lectura estable' : 'Estabilizando...'}
                </span>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="p-4 bg-slate-50 rounded-[4px] border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block tracking-widest uppercase mb-1">
                Pantalla Digital de Balanza
              </span>
              <div className="text-3xl font-mono text-slate-400 my-1">0.000 KG</div>
              <span className="text-[10px] text-slate-400">
                Conecte la báscula para leer peso en vivo
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || saving}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isConnecting ? 'Conectando...' : 'Conectar Báscula'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] rounded-[4px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-slate-50 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScaleSettingsModal
