import React, { useState, useEffect } from 'react'
import { X } from '../../../shared/icons/Icons'
import type { SerialPortInfo, ScaleConfigInput, BaudRate } from '@shared/contracts'
import { ScalePortSettingsFields } from './ScalePortSettingsFields'
import { ScaleReadoutPanels } from './ScaleReadoutPanels'

interface ScaleSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onFeedback: (msg: string) => void
  onStateChange: () => void
}

export const ScaleSettingsModal: React.FC<ScaleSettingsModalProps> = ({
  isOpen,
  onClose,
  onFeedback,
  onStateChange
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

  // Cargar configuración guardada y puertos disponibles al abrir
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    const clearErrorTimer = window.setTimeout(() => setErrorMsg(null), 0)

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
          if (cancelled) return
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
      window.clearTimeout(clearErrorTimer)
    }
  }, [isOpen])

  // Leer peso en vivo si está conectado
  useEffect(() => {
    if (!isOpen || !isConnected) return

    let cancelled = false
    let nextRead: ReturnType<typeof setTimeout> | null = null
    const readWeightLoop = async (): Promise<void> => {
      try {
        const reading = await window.api.hardware.readWeight()
        if (cancelled) return
        if (reading.error) {
          setErrorMsg(reading.error)
          setScaleWeight('Error')
          setIsStable(false)
        } else {
          setScaleWeight(`${reading.weightKg.toFixed(3)} KG`)
          setIsStable(reading.isStable)
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Error leyendo peso')
          setScaleWeight('Error')
          setIsStable(false)
        }
      }
      if (!cancelled) nextRead = setTimeout(() => void readWeightLoop(), 1000)
    }

    void readWeightLoop()

    return () => {
      cancelled = true
      if (nextRead) clearTimeout(nextRead)
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
      onStateChange()
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
      onStateChange()
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
      onFeedback('Configuración de báscula guardada correctamente')
      onStateChange()
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[90vh]">
        <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
          <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Configuración de Báscula (RS-232 / COM)
          </h3>
          <button
            onClick={onClose}
            className="text-[#5C5C5C] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded cursor-pointer"
          >
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

          <ScalePortSettingsFields
            comPort={comPort}
            baudRate={baudRate}
            availablePorts={availablePorts}
            isConnecting={isConnecting}
            isConnected={isConnected}
            onPortChange={setComPort}
            onBaudRateChange={setBaudRate}
            onRefreshPorts={() => void handleListPorts()}
          />

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

          <ScaleReadoutPanels
            isConnected={isConnected}
            comPort={comPort}
            baudRate={baudRate}
            scaleWeight={scaleWeight}
            isStable={isStable}
          />
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
