import React, { useState, useMemo, useEffect } from 'react'
import type { Product } from '@shared/contracts'
import { Building2, Search, RefreshCw, X } from '../../../shared/icons/Icons'
import StockBranchTable from './StockBranchTable'
import StockBranchTransferForm from './StockBranchTransferForm'
import { MOCK_BRANCHES, type BranchTab } from './stockBranch.data'

interface StockBranchModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  products?: Product[]
  onConfirmTransfer?: (transferDetails: {
    targetBranchId: string
    quantity: number
    reason: string
    printQrTicket: boolean
    sendWsAlert: boolean
  }) => void
}

const TABS: { id: BranchTab; label: string }[] = [
  { id: 'ALL', label: 'Todas las Sucursales' },
  { id: 'NEARBY', label: 'Cercanas (≤ 10 km)' },
  { id: 'CEDI', label: 'CEDI Central' },
  { id: 'TRANSIT', label: 'En Tránsito' }
]

export const StockBranchModal: React.FC<StockBranchModalProps> = ({
  isOpen,
  onClose,
  product,
  products = [],
  onConfirmTransfer
}) => {
  const selectedProduct = product || products[0] || null
  const [activeTab, setActiveTab] = useState<BranchTab>('ALL')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    MOCK_BRANCHES[1]?.id ?? MOCK_BRANCHES[0].id
  )
  const [transferQty, setTransferQty] = useState<number>(10)
  const [transferReason, setTransferReason] = useState<string>('Reposición de Emergencia')
  const [printQrTicket, setPrintQrTicket] = useState(true)
  const [sendWsAlert, setSendWsAlert] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'F5') {
        e.preventDefault()
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 600)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleRefresh = (): void => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const filteredBranches = useMemo(() => {
    return MOCK_BRANCHES.filter((b) => {
      const matchesTab =
        activeTab === 'ALL'
          ? true
          : activeTab === 'NEARBY'
            ? b.distanceKm <= 10
            : activeTab === 'CEDI'
              ? b.type === 'Centro Logístico CEDI'
              : b.type === 'En Tránsito'

      const matchesAvailable = onlyAvailable ? b.physicalStock - b.reservedStock > 0 : true

      return matchesTab && matchesAvailable
    })
  }, [activeTab, onlyAvailable])

  if (!isOpen) return null

  const activeBranch = MOCK_BRANCHES.find((b) => b.id === selectedBranchId) || MOCK_BRANCHES[1]
  const availableInSelected = Math.max(0, activeBranch.physicalStock - activeBranch.reservedStock)
  const totalNetworkStock = MOCK_BRANCHES.reduce((acc, b) => acc + b.physicalStock, 0)
  const localStock = product?.stock ?? 8

  const handleSubmitTransfer = (): void => {
    onConfirmTransfer?.({
      targetBranchId: selectedBranchId,
      quantity: transferQty,
      reason: transferReason,
      printQrTicket,
      sendWsAlert
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop select-none">
      <div className="w-full max-w-4xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] border border-[#0067C0]/20 flex items-center justify-center shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                  Consulta de Stock en Sucursales &amp; Traslados
                </h2>
                <span className="kbd-badge text-[10px] text-[#0067C0] bg-[#EBF0F5] border-[#0067C0]/30">
                  ALT+O
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#5C5C5C] mt-0.5 font-medium">
                <span className="flex items-center gap-1 text-[#107C41] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#107C41] animate-pulse"></span>
                  Conexión Multi-Tienda Online (Mesh Sync)
                </span>
                <span>•</span>
                <span>
                  Latencia de Red:{' '}
                  <strong className="font-mono text-[#1B1B1B]">24 ms</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refrescar datos [F5]"
              className="p-1.5 text-[#5C5C5C] hover:text-[#0067C0] hover:bg-[#EBF0F5] rounded-[4px] transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#0067C0]' : ''} />
              <span className="kbd-badge text-[10px]">F5</span>
            </button>
            <span className="kbd-badge text-[10px] text-[#717783]">ESC</span>
            <button
              onClick={onClose}
              className="p-1 text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] rounded transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#F3F3F3] border-b border-[#E5E5E5] space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="md:col-span-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C] mb-1">
                Producto Consultado [F4]
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]" />
                <input
                  type="text"
                  readOnly
                  value={
                    selectedProduct
                      ? `${selectedProduct.name} (SKU: ${selectedProduct.code})`
                      : 'Aceite Vegetal Primor 1L — SKU: 7750243001'
                  }
                  className="w-full pl-9 pr-16 py-2 text-xs font-bold font-mono text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] shadow-xs"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 kbd-badge text-[10px]">
                  F4
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-[4px] border border-[#E5E5E5] shadow-xs">
              <div className="border-r border-[#E5E5E5] pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#717783]">
                  Stock Total Red
                </span>
                <span className="text-lg font-extrabold font-mono text-[#0067C0]">
                  {totalNetworkStock} pzas
                </span>
              </div>
              <div className="pl-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#717783]">
                  Stock Tienda Local
                </span>
                <span className="text-lg font-extrabold font-mono text-[#C42B1C]">
                  {localStock} pzas
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5E5E5]">
            <div className="flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0067C0] text-white shadow-xs'
                      : 'bg-white text-[#5C5C5C] border border-[#D1D1D1] hover:bg-[#F9F9F9]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs font-medium text-[#1B1B1B] cursor-pointer select-none bg-white px-2.5 py-1 rounded-[4px] border border-[#D1D1D1]">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1] focus:ring-[#0067C0]"
              />
              <span>Solo con Stock Disponible (&gt; 0)</span>
            </label>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <StockBranchTable
            branches={filteredBranches}
            selectedBranchId={selectedBranchId}
            onSelect={setSelectedBranchId}
          />

          <StockBranchTransferForm
            activeBranchName={activeBranch.name}
            availableInSelected={availableInSelected}
            quantity={transferQty}
            onQuantityChange={setTransferQty}
            reason={transferReason}
            onReasonChange={setTransferReason}
            printQrTicket={printQrTicket}
            onPrintQrChange={setPrintQrTicket}
            sendWsAlert={sendWsAlert}
            onSendWsChange={setSendWsAlert}
            onClose={onClose}
            onSubmit={handleSubmitTransfer}
          />
        </div>
      </div>
    </div>
  )
}

export default StockBranchModal
