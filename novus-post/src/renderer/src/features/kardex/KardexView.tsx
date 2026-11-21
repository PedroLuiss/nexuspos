import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { KardexExportFormat, KardexMovementPage, KardexMovementQuery } from '@shared/contracts'
import { KardexSummary } from './components/KardexSummary'
import { KardexTable } from './components/KardexTable'
import { KardexToolbar } from './components/KardexToolbar'

interface KardexViewProps {
  data: KardexMovementPage
  query: KardexMovementQuery
  onQueryChange: Dispatch<SetStateAction<KardexMovementQuery>>
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onExport: (format: KardexExportFormat) => Promise<boolean>
}

export const KardexView: React.FC<KardexViewProps> = ({
  data,
  query,
  onQueryChange,
  isLoading,
  error,
  onRefresh,
  onExport
}) => (
  <div className="flex h-full flex-col space-y-2.5 bg-[#F3F3F3] p-3">
    <KardexSummary summary={data.summary} />
    <KardexToolbar
      query={query}
      onQueryChange={onQueryChange}
      isLoading={isLoading}
      onRefresh={onRefresh}
      onExport={onExport}
    />
    {error && (
      <div
        role="alert"
        className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#C42B1C]"
      >
        No se pudo cargar el Kardex: {error}
      </div>
    )}
    <KardexTable data={data} query={query} onQueryChange={onQueryChange} isLoading={isLoading} />
  </div>
)

export default KardexView
