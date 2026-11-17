import type { DatabaseBackup, DatabaseStatus } from '@shared/contracts'
import { RefreshCw, ShieldCheck } from '../../../shared/icons/Icons'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString('es-VE') : 'Nunca'
}

export function DatabaseStatusPanel({
  status,
  isLoading,
  isBusy,
  onRefresh
}: {
  status: DatabaseStatus | null
  isLoading: boolean
  isBusy: boolean
  onRefresh: () => void
}): React.JSX.Element {
  return (
    <section className="rounded border border-[#E5E5E5] bg-[#F9F9F9] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-bold">Estado de la base de datos</h4>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading || isBusy}
          className="flex items-center gap-1 text-[#0067C0] disabled:opacity-50"
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>
      {isLoading && !status ? (
        <p role="status" className="py-4 text-center text-[#5C5C5C]">
          Consultando SQLite…
        </p>
      ) : status ? (
        <>
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <StatusFact label="Archivo activo" value={status.fileName} />
            <StatusFact label="Tamaño" value={formatBytes(status.sizeBytes)} />
            <StatusFact label="Esquema" value={`Versión ${status.schemaVersion}`} />
            <StatusFact
              label="Integridad SQLite"
              value={status.integrity === 'ok' ? 'Correcta' : status.integrityMessage}
              good={status.integrity === 'ok'}
            />
            <StatusFact label="Productos" value={status.productCount.toLocaleString('es-VE')} />
            <StatusFact label="Facturas" value={status.salesCount.toLocaleString('es-VE')} />
            <StatusFact label="Clientes" value={status.customerCount.toLocaleString('es-VE')} />
            <StatusFact label="Último respaldo" value={formatDate(status.lastBackupAt)} />
            <StatusFact
              label="Espacio recuperable"
              value={`${status.freePages.toLocaleString('es-VE')} páginas`}
            />
          </dl>
          <p className="mt-2 text-[10px] text-[#5C5C5C]">
            Los respaldos se almacenan localmente en la carpeta de datos de NexusPOS.
          </p>
        </>
      ) : null}
    </section>
  )
}

export function DatabaseBackupHistory({
  backups
}: {
  backups: DatabaseBackup[]
}): React.JSX.Element {
  return (
    <section className="rounded border border-[#E5E5E5] p-3">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-700" />
        <h4 className="font-bold">Historial de respaldos locales (últimos 20)</h4>
      </div>
      {backups.length === 0 ? (
        <p className="py-3 text-center text-[#717783]">Todavía no hay respaldos locales.</p>
      ) : (
        <ul className="max-h-36 divide-y divide-[#E5E5E5] overflow-y-auto">
          {backups.map((backup) => (
            <li key={backup.fileName} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="break-all font-mono">{backup.fileName}</span>
              <span className="text-[#5C5C5C]">
                {formatBytes(backup.sizeBytes)} · {formatDate(backup.createdAt)}
                {backup.remoteStatus && (
                  <span
                    className={`ml-2 font-semibold ${
                      backup.remoteStatus === 'uploaded'
                        ? 'text-emerald-700'
                        : backup.remoteStatus === 'failed'
                          ? 'text-red-700'
                          : 'text-amber-700'
                    }`}
                  >
                    {backup.remoteStatus === 'uploaded'
                      ? '· enviado a Laravel'
                      : backup.remoteStatus === 'failed'
                        ? '· error remoto'
                        : '· endpoint pendiente'}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function StatusFact({
  label,
  value,
  good = false
}: {
  label: string
  value: string
  good?: boolean
}): React.JSX.Element {
  return (
    <div className="min-w-0 rounded border border-[#E5E5E5] bg-white p-2">
      <dt className="text-[10px] uppercase text-[#717783]">{label}</dt>
      <dd className={`break-words font-semibold ${good ? 'text-emerald-700' : ''}`}>{value}</dd>
    </div>
  )
}
