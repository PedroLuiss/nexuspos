import React, { useState, useMemo, useEffect } from 'react'
import { Product } from '../../../shared/types/domain'
import {
  Building2,
  Search,
  RefreshCw,
  Truck,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Minus,
  ArrowRightLeft,
  X,
  Printer,
  Wifi,
  QrCode,
  ShieldCheck,
  Check
} from '../../../shared/icons/Icons'

export interface BranchStockInfo {
  id: string
  name: string
  type: 'Tienda Express' | 'Hipermercado' | 'Centro Logístico CEDI' | 'En Tránsito'
  address: string
  distanceKm: number
  physicalStock: number
  reservedStock: number
  phoneExt: string
  contactName: string
  status: 'ONLINE' | 'OFFLINE'
}

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

const MOCK_BRANCHES: BranchStockInfo[] = [
  {
    id: 'br-1',
    name: 'Sucursal Miraflores (Caja-01)',
    type: 'Tienda Express',
    address: 'Av. Larco 456, Miraflores',
    distanceKm: 2.4,
    physicalStock: 48,
    reservedStock: 4,
    phoneExt: 'Anexo 102',
    contactName: 'Carlos Mendoza',
    status: 'ONLINE'
  },
  {
    id: 'br-2',
    name: 'Sucursal San Isidro',
    type: 'Tienda Express',
    address: 'Av. Rivera Navarrete 780, San Isidro',
    distanceKm: 4.8,
    physicalStock: 120,
    reservedStock: 12,
    phoneExt: 'Anexo 205',
    contactName: 'Ana Sofía Torres',
    status: 'ONLINE'
  },
  {
    id: 'br-3',
    name: 'Sucursal Surco Chacarilla',
    type: 'Hipermercado',
    address: 'Av. Primavera 1230, Surco',
    distanceKm: 8.1,
    physicalStock: 65,
    reservedStock: 0,
    phoneExt: 'Anexo 301',
    contactName: 'Jorge Ramírez',
    status: 'ONLINE'
  },
  {
    id: 'br-4',
    name: 'CEDI Lurín (Almacén Central)',
    type: 'Centro Logístico CEDI',
    address: 'Km 32 Panamericana Sur, Lurín',
    distanceKm: 24.5,
    physicalStock: 850,
    reservedStock: 50,
    phoneExt: 'Anexo 900',
    contactName: 'Almacén Central',
    status: 'ONLINE'
  },
  {
    id: 'br-5',
    name: 'Unidad Móvil Logística #02',
    type: 'En Tránsito',
    address: 'En ruta Panamericana Sur -> Lince',
    distanceKm: 1.2,
    physicalStock: 30,
    reservedStock: 0,
    phoneExt: 'Anexo 555',
    contactName: 'Conductor: Miguel Ángel',
    status: 'ONLINE'
  }
]

export const StockBranchModal: React.FC<StockBranchModalProps> = ({
  isOpen,
  onClose,
  product,
  products = [],
  onConfirmTransfer
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(product || products[0] || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEARBY' | 'CEDI' | 'TRANSIT'>('ALL')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(MOCK_BRANCHES[1].id)
  const [transferQty, setTransferQty] = useState<number>(10)
  const [transferReason, setTransferReason] = useState<string>('Reposición de Emergencia')
  const [printQrTicket, setPrintQrTicket] = useState(true)
  const [sendWsAlert, setSendWsAlert] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (product) setSelectedProduct(product)
  }, [product])

  // Hotkey listener for modal shortcuts: ESC, F4, F5, F10
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'F5') {
        e.preventDefault()
        handleRefresh()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleRefresh = () => {
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

      const matchesQuery =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.contactName.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTab && matchesAvailable && matchesQuery
    })
  }, [activeTab, onlyAvailable, searchQuery])

  // Total metrics
  const totalNetworkStock = MOCK_BRANCHES.reduce((acc, b) => acc + b.physicalStock, 0)
  const localStock = product?.stock ?? 8

  if (!isOpen) return null

  const activeBranch = MOCK_BRANCHES.find((b) => b.id === selectedBranchId) || MOCK_BRANCHES[1]
  const availableInSelected = Math.max(0, activeBranch.physicalStock - activeBranch.reservedStock)

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    if (onConfirmTransfer) {
      onConfirmTransfer({
        targetBranchId: selectedBranchId,
        quantity: transferQty,
        reason: transferReason,
        printQrTicket,
        sendWsAlert
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop select-none">
      <div className="w-full max-w-4xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[92vh]">
        {/* 1. Cabecera WinUI 3 & Telemetría Mesh Sync */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] border border-[#0067C0]/20 flex items-center justify-center shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                  StockBranchModal.tsx — Consulta de Stock en Sucursales & Traslados
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
                <span>Latencia de Red: <strong className="font-mono text-[#1B1B1B]">24 ms</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-1.5 text-[#5C5C5C] hover:text-[#0067C0] hover:bg-[#EBF0F5] rounded-[4px] transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Refrescar datos [F5]"
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

        {/* 2. Barra de Búsqueda de Producto & Consolidado de Red */}
        <div className="p-4 bg-[#F3F3F3] border-b border-[#E5E5E5] space-y-3 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Buscador de Producto precargado */}
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

            {/* Tarjeta Métricas Consolidadas */}
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

          {/* Segmentos de Filtrado (Fluent Tabs) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5E5E5]">
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: 'Todas las Sucursales' },
                { id: 'NEARBY', label: 'Cercanas (< 10 km)' },
                { id: 'CEDI', label: 'CEDI Lurín (Central)' },
                { id: 'TRANSIT', label: 'En Tránsito' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0067C0] text-white shadow-xs'
                      : 'bg-white text-[#5C5C5C] hover:bg-[#EBEBEB] border border-[#D1D1D1]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Toggle Switch Stock > 0 */}
            <label className="flex items-center gap-2 text-xs font-medium text-[#1B1B1B] cursor-pointer select-none bg-white px-2.5 py-1 rounded-[4px] border border-[#D1D1D1]">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1] focus:ring-[#0067C0]"
              />
              <span>Solo tiendas con Stock Disponible (&gt; 0)</span>
            </label>
          </div>
        </div>

        {/* 3. DataGrid de Sucursales & Almacenes Remotos */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3">SUCURSAL / ALMACÉN</th>
                  <th className="py-2.5 px-3">TIPO</th>
                  <th className="py-2.5 px-3">DISTANCIA & DIRECCIÓN</th>
                  <th className="py-2.5 px-3 text-center">STOCK FÍSICO</th>
                  <th className="py-2.5 px-3 text-center">DISPONIBLE</th>
                  <th className="py-2.5 px-3">CONTACTO / ANEXO</th>
                  <th className="py-2.5 px-3 text-center">ACCIÓN</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredBranches.map((b) => {
                  const isSelected = b.id === selectedBranchId
                  const available = b.physicalStock - b.reservedStock

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]'
                          : 'hover:bg-[#F9F9F9]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#1B1B1B]">
                        <div className="flex items-center gap-1.5">
                          <span>{b.name}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-[#0067C0]"></span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-[3px] border ${
                            b.type === 'Centro Logístico CEDI'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : b.type === 'En Tránsito'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-[#0067C0] border-blue-200'
                          }`}
                        >
                          {b.type}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-[#5C5C5C]">
                        <div className="flex items-center gap-1 font-semibold text-[#1B1B1B]">
                          <MapPin size={12} className="text-[#0067C0]" />
                          <span>{b.distanceKm} km</span>
                        </div>
                        <div className="text-[11px] text-[#717783] truncate max-w-[200px]">{b.address}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#1B1B1B]">
                        {b.physicalStock} pzas
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                            available > 20
                              ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                              : available > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-[#C42B1C] border border-red-200'
                          }`}
                        >
                          {available} pzas
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-[#5C5C5C]">
                        <div className="flex items-center gap-1 font-mono font-semibold text-[#1B1B1B]">
                          <PhoneCall size={12} className="text-[#107C41]" />
                          <span>{b.phoneExt}</span>
                        </div>
                        <div className="text-[11px] text-[#717783]">{b.contactName}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBranchId(b.id)
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#0067C0] text-white shadow-xs'
                              : 'bg-white border border-[#D1D1D1] text-[#1B1B1B] hover:bg-[#F9F9F9]'
                          }`}
                        >
                          {isSelected ? 'Seleccionada' : 'Seleccionar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 4. Módulo de Creación de Solicitud de Traslado / Reserva */}
          <form
            onSubmit={handleSubmitTransfer}
            className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-[6px] p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-[#0067C0]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B1B]">
                  Generar Orden de Traslado Inter-Tienda desde: <span className="text-[#0067C0] font-mono">{activeBranch.name}</span>
                </h3>
              </div>
              <span className="text-xs text-[#5C5C5C]">
                Stock disponible en origen: <strong className="font-mono text-[#107C41]">{availableInSelected} pzas</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Cantidad requerida con Stepper */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                  Cantidad Requerida (Unidades)
                </label>
                <div className="flex items-center border border-[#D1D1D1] rounded-[4px] bg-white shadow-xs w-36">
                  <button
                    type="button"
                    onClick={() => setTransferQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-[#5C5C5C] hover:bg-[#F3F3F3] cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableInSelected}
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center font-bold font-mono text-xs border-x border-[#E5E5E5] py-1 text-[#1B1B1B]"
                  />
                  <button
                    type="button"
                    onClick={() => setTransferQty((q) => Math.min(availableInSelected, q + 1))}
                    className="px-3 py-1.5 text-[#5C5C5C] hover:bg-[#F3F3F3] cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Motivo de traslado */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                  Motivo del Movimiento
                </label>
                <select
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#D1D1D1] rounded-[4px] font-medium text-[#1B1B1B]"
                >
                  <option value="Reposición de Emergencia">Reposición de Emergencia</option>
                  <option value="Venta en Mostrador">Venta en Mostrador Directa</option>
                  <option value="Reserva de Cliente">Reserva Especial para Cliente</option>
                  <option value="Balance de Inventario">Balance de Inventario Mensual</option>
                </select>
              </div>

              {/* Emisión rápida de opciones */}
              <div className="space-y-1.5 pt-2 md:pt-0">
                <label className="flex items-center gap-2 text-xs text-[#1B1B1B] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printQrTicket}
                    onChange={(e) => setPrintQrTicket(e.target.checked)}
                    className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1]"
                  />
                  <span className="flex items-center gap-1">
                    <QrCode size={13} className="text-[#0067C0]" />
                    Imprimir Ticket de Reserva con QR
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#1B1B1B] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendWsAlert}
                    onChange={(e) => setSendWsAlert(e.target.checked)}
                    className="w-4 h-4 text-[#0067C0] rounded border-[#D1D1D1]"
                  />
                  <span className="flex items-center gap-1">
                    <Wifi size={13} className="text-[#107C41]" />
                    Alerta sonora WebSocket en Terminal Origen
                  </span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* 5. Barra de Comandos Inferior (Command Bar) */}
        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3 text-xs text-[#5C5C5C]">
            <span className="flex items-center gap-1">
              <span className="kbd-badge">ESC</span> Cerrar
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd-badge">F4</span> Buscar
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd-badge">F5</span> Refrescar
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd-badge">ALT+T</span> Traslado
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
            >
              Cancelar [ESC]
            </button>
            <button
              type="button"
              onClick={handleSubmitTransfer}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
            >
              <Check size={15} />
              <span>Confirmar Solicitud de Traslado</span>
              <span className="kbd-badge bg-white/20 text-white border-white/30 text-[10px]">
                F10 / ENTER
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockBranchModal
