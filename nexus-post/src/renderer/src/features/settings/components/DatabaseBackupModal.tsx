import { useCallback, useEffect, useState } from 'react'
import type { DatabaseBackup, DatabaseStatus } from '@shared/contracts'
import { X } from '../../../shared/icons/Icons'
import { DatabaseBackupHistory, DatabaseStatusPanel } from './DatabaseBackupPanels'

interface DatabaseBackupModalProps {
  isOpen: boolean
  onClose: () => void
  onFeedback: (message: string, type?: 'success' | 'error') => void
}

export function DatabaseBackupModal({
  isOpen,
  onClose,
  onFeedback
}: DatabaseBackupModalProps): React.JSX.Element | null {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [backups, setBackups] = useState<DatabaseBackup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const [currentStatus, recentBackups] = await Promise.all([
        window.api.database.getStatus(),
        window.api.database.listBackups()
      ])
      setStatus(currentStatus)
      setBackups(recentBackups)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const timerId = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timerId)
  }, [isOpen, refresh])

  if (!isOpen) return null

  const runAction = async (
    action: string,
    operation: () => Promise<DatabaseStatus | DatabaseBackup | void>,
    successMessage: (result: DatabaseStatus | DatabaseBackup | void) => string
  ): Promise<void> => {
    setBusyAction(action)
    setError(null)
    try {
      const result = await operation()
      if (result && 'integrity' in result) setStatus(result)
      if (result && 'remoteStatus' in result) {
        setBackups((current) => [result, ...current].slice(0, 20))
        setStatus((current) => (current ? { ...current, lastBackupAt: result.createdAt } : current))
      } else {
        await refresh()
      }
      const feedbackType =
        result && 'remoteStatus' in result && result.remoteStatus === 'failed' ? 'error' : 'success'
      onFeedback(successMessage(result), feedbackType)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      setError(message)
      onFeedback(message, 'error')
    } finally {
      setBusyAction(null)
    }
  }

  const createBackup = async (): Promise<void> => {
    await runAction(
      'backup',
      () => window.api.database.createBackup(),
      (result) => {
        if (!result || !('remoteStatus' in result)) return 'Respaldo local creado.'
        if (result.remoteStatus === 'uploaded') {
          return `Respaldo local y remoto creado: ${result.fileName}.`
        }
        return `${result.fileName}: ${result.remoteMessage}`
      }
    )
  }

  const verify = async (): Promise<void> => {
    await runAction(
      'verify',
      () => window.api.database.verifyIntegrity(),
      (result) =>
        result && 'integrity' in result
          ? result.integrity === 'ok'
            ? 'La base de datos superó la verificación de integridad.'
            : `La verificación encontró incidencias: ${result.integrityMessage}`
          : 'Verificación terminada.'
    )
  }

  const optimize = async (): Promise<void> => {
    if (
      !window.confirm(
        'Antes de optimizar se creará un respaldo local automático. ¿Desea continuar?'
      )
    ) {
      return
    }
    await runAction(
      'optimize',
      () => window.api.database.optimize(),
      () => 'Base optimizada. Se creó un respaldo local preventivo.'
    )
  }

  const restore = async (): Promise<void> => {
    setBusyAction('restore')
    setError(null)
    try {
      await window.api.database.restoreBackup()
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      setError(message)
      onFeedback(message, 'error')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="database-maintenance-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[6px] border border-[#D1D1D1] bg-white shadow-[0_16px_32px_rgba(0,0,0,0.12)]"
      >
        <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] px-5 py-3">
          <div>
            <h3 id="database-maintenance-title" className="text-xs font-bold uppercase">
              Centro de respaldo y mantenimiento
            </h3>
            <p className="mt-1 text-[11px] text-[#5C5C5C]">
              Respaldo local, envío Laravel preparado, integridad, optimización y restauración
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded p-1 hover:bg-[#EBEBEB]">
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-5 text-xs">
          {error && (
            <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">
              {error}
            </div>
          )}

          <DatabaseStatusPanel
            status={status}
            isLoading={isLoading}
            isBusy={busyAction !== null}
            onRefresh={() => void refresh()}
          />

          <section className="grid gap-2 sm:grid-cols-3">
            <ActionButton
              title="Crear y enviar respaldo"
              description="Crea una copia SQLite verificada y la guarda localmente. El envío Laravel se activa al configurar el endpoint."
              label={busyAction === 'backup' ? 'Creando…' : 'Crear respaldo ahora'}
              disabled={busyAction !== null}
              onClick={() => void createBackup()}
            />
            <ActionButton
              title="Verificar integridad"
              description="Ejecuta la comprobación de integridad nativa de SQLite."
              label={busyAction === 'verify' ? 'Verificando…' : 'Verificar base'}
              disabled={busyAction !== null}
              onClick={() => void verify()}
            />
            <ActionButton
              title="Optimizar base"
              description="Crea respaldo preventivo, libera espacio vacío y actualiza estadísticas SQLite."
              label={busyAction === 'optimize' ? 'Optimizando…' : 'Optimizar SQLite'}
              disabled={busyAction !== null}
              onClick={() => void optimize()}
            />
          </section>

          <DatabaseBackupHistory backups={backups} />

          <section className="rounded border border-red-200 bg-red-50/50 p-3">
            <h4 className="font-bold text-[#C42B1C]">Restaurar una copia externa</h4>
            <p className="my-2 text-[11px] text-[#5C5C5C]">
              Solo se aceptan respaldos NexusPOS íntegros y compatibles. Se crea una copia
              preventiva automática antes de restaurar; después la aplicación se reinicia.
            </p>
            <button
              type="button"
              onClick={() => void restore()}
              disabled={busyAction !== null}
              className="w-full rounded border border-red-300 bg-white py-2 font-bold text-[#C42B1C] hover:bg-red-50 disabled:opacity-50"
            >
              {busyAction === 'restore'
                ? 'Preparando restauración…'
                : 'Seleccionar respaldo y restaurar'}
            </button>
          </section>
        </div>

        <footer className="flex justify-end border-t border-[#E5E5E5] bg-[#F9F9F9] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-[#D1D1D1] bg-white px-3.5 py-1.5 font-semibold hover:bg-slate-50"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  )
}

function ActionButton({
  title,
  description,
  label,
  disabled,
  onClick
}: {
  title: string
  description: string
  label: string
  disabled: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <article className="rounded border border-[#E5E5E5] p-3">
      <h4 className="font-bold">{title}</h4>
      <p className="my-2 min-h-10 text-[10px] text-[#5C5C5C]">{description}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded bg-[#0067C0] py-2 font-bold text-white hover:bg-[#005A9E] disabled:opacity-50"
      >
        {label}
      </button>
    </article>
  )
}

export default DatabaseBackupModal
