import React, { useState } from 'react'
import { ShiftState, CashMovement } from '../../shared/types/domain'
import {
  Wallet,
  DollarSign,
  Minus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
  Users,
  Clock
} from '../../shared/icons/Icons'

interface CashShiftViewProps {
  shift: ShiftState
  cashMovements: CashMovement[]
  onAddCashMovement: (movement: Omit<CashMovement, 'id' | 'timestamp'>) => void
  onCloseShift: (countedCash: number) => void
}

export const CashShiftView: React.FC<CashShiftViewProps> = ({
  shift,
  cashMovements,
  onAddCashMovement,
  onCloseShift
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'INGRESO' | 'EGRESO'>('EGRESO')
  const [amount, setAmount] = useState<number>(0)
  const [concept, setConcept] = useState('')

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false)
  const [countedCash, setCountedCash] = useState<number>(0)
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(1000)

  // Calculations
  const clientAbonos = 1450.0 // Abonos recibidos de cuentas por cobrar en turno
  const expectedCashInDrawer =
    shift.initialAmount +
    shift.totalCashSales +
    clientAbonos +
    shift.extraIncomes -
    shift.extraExpenses

  const totalSalesAll =
    shift.totalCashSales +
    shift.totalCardSales +
    shift.totalMixedSales +
    shift.totalCreditSales

  const profitWithoutTax = totalSalesAll * 0.32
  const profitWithTax = profitWithoutTax * 0.84 // Net after 16% tax margin

  const cashDifference = countedCash - expectedCashInDrawer

  const handleSaveMovement = (e: React.FormEvent): void => {
    e.preventDefault()
    if (amount <= 0 || !concept.trim()) return

    onAddCashMovement({
      type: modalType,
      amount,
      concept: concept.trim(),
      user: shift.cashier
    })

    setAmount(0)
    setConcept('')
    setIsModalOpen(false)
  }

  const handleConfirmClose = (e: React.FormEvent): void => {
    e.preventDefault()
    onCloseShift(countedCash)
    setIsCloseModalOpen(false)
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto bg-[#F3F3F3]">
      {/* Top Shift Header (Fluent Box) */}
      <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">Corte de Caja y Turnos</h2>
              <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-[#107C41] text-[10px] font-bold border border-emerald-200">
                TURNO #04 ABIERTO
              </span>
            </div>
            <p className="text-xs text-[#5C5C5C] mt-0.5">
              Cajero Responsable: <strong className="text-[#1B1B1B]">{shift.cashier}</strong> • Apertura:{' '}
              <span className="font-mono text-[#5C5C5C]">{shift.openedAt}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Apertura de turno */}
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Clock size={14} className="text-[#717783]" />
            <span>Apertura de Turno</span>
          </button>

          {/* Registrar Gasto Manual [ALT+G] */}
          <button
            onClick={() => {
              setModalType('EGRESO')
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C42B1C] bg-white hover:bg-red-50 border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Minus size={14} className="text-[#C42B1C]" />
            <span>Registrar Gasto Manual</span>
            <span className="font-mono text-[10px] text-[#C42B1C] bg-red-50 px-1 rounded border border-red-200">
              [ALT+G]
            </span>
          </button>

          {/* Cierre de Turno */}
          <button
            onClick={() => {
              setCountedCash(expectedCashInDrawer)
              setIsCloseModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
          >
            <Clock size={14} />
            <span>Cierre de Turno (Arqueo)</span>
          </button>
        </div>
      </div>

      {/* Dashboard KPI Overview: Ventas Totales & Ganancia con/sin impuestos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Ventas Totales */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
            Ventas Totales del Turno
          </span>
          <div className="text-3xl font-extrabold font-mono text-[#1B1B1B] mt-1.5">
            ${totalSalesAll.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">
            Efectivo, Tarjeta, Mixto y Crédito
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0067C0]"></div>
        </div>

        {/* Ganancia Bruta (Sin Impuestos) */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
              Ganancia Bruta (Sin Impuestos)
            </span>
            <span className="text-xs font-bold text-[#107C41] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              +32.0%
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#107C41] mt-1.5">
            ${profitWithoutTax.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">
            Margen comercial sobre costo
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#107C41]"></div>
        </div>

        {/* Ganancia Neta (Con Impuestos) */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#5C5C5C] uppercase tracking-wider">
              Ganancia Neta (Con Impuestos)
            </span>
            <span className="text-xs font-bold text-[#0067C0] bg-[#0067C0]/10 px-1.5 py-0.2 rounded border border-[#0067C0]/20">
              Neto
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#0067C0] mt-1.5">
            ${profitWithTax.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#717783] mt-0.5">
            Utilidad disponible descontando IVA (16%)
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0067C0]"></div>
        </div>
      </div>

      {/* PANEL ESTRUCTURADO: "Dinero en Caja" [Inicio] [+Abonos] [+Entradas] [-Salidas] [=Total final] */}
      <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B1B] border-b border-[#E5E5E5] pb-2 mb-3 flex items-center justify-between">
          <span>Panel de Arqueo: Dinero en Gaveta de Caja</span>
          <span className="text-[#717783] font-mono text-[11px]">Ecuación Contable de Turno</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* [Inicio] */}
          <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-[4px] text-center">
            <span className="text-[11px] font-bold text-[#5C5C5C] block uppercase">[Inicio] Fondo</span>
            <div className="text-xl font-bold font-mono text-[#1B1B1B] mt-1">
              ${shift.initialAmount.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#717783]">Apertura</span>
          </div>

          {/* [+Abonos] */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-[4px] text-center">
            <span className="text-[11px] font-bold text-[#107C41] block uppercase">[+Abonos]</span>
            <div className="text-xl font-bold font-mono text-[#107C41] mt-1">
              +${clientAbonos.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-700">Cobro de créditos</span>
          </div>

          {/* [+Entradas] */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-[4px] text-center">
            <span className="text-[11px] font-bold text-[#107C41] block uppercase">[+Entradas]</span>
            <div className="text-xl font-bold font-mono text-[#107C41] mt-1">
              +${shift.extraIncomes.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-700">Ingresos extra</span>
          </div>

          {/* [-Salidas] */}
          <div className="p-3 bg-red-50/50 border border-red-200 rounded-[4px] text-center">
            <span className="text-[11px] font-bold text-[#C42B1C] block uppercase">[-Salidas]</span>
            <div className="text-xl font-bold font-mono text-[#C42B1C] mt-1">
              -${shift.extraExpenses.toFixed(2)}
            </div>
            <span className="text-[10px] text-red-700">Gastos / Pagos</span>
          </div>

          {/* [=Total final] */}
          <div className="p-3 bg-[#0067C0]/10 border border-[#0067C0]/30 rounded-[4px] text-center col-span-2 md:col-span-1">
            <span className="text-[11px] font-extrabold text-[#0067C0] block uppercase">
              [=Total Final]
            </span>
            <div className="text-2xl font-extrabold font-mono text-[#0067C0] mt-1">
              ${expectedCashInDrawer.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#5C5C5C] font-medium">Efectivo Físico</span>
          </div>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Manual Movements Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1">
        {/* Left: Payment Methods Breakdown */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3.5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B1B] border-b border-[#E5E5E5] pb-2 mb-3">
              Desglose de Ventas por Forma de Pago
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[4px] bg-emerald-50 text-[#107C41] flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1B1B1B]">Efectivo en Caja</div>
                    <div className="text-[10px] text-[#717783]">Cobros directos en ventanilla</div>
                  </div>
                </div>
                <div className="text-right font-bold font-mono text-[#1B1B1B] text-sm">
                  ${shift.totalCashSales.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1B1B1B]">Tarjeta / Terminal Bancaria</div>
                    <div className="text-[10px] text-[#717783]">Depósito en cuenta comercial</div>
                  </div>
                </div>
                <div className="text-right font-bold font-mono text-[#1B1B1B] text-sm">
                  ${shift.totalCardSales.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[4px] bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1B1B1B]">Pagos Mixtos (Divididos)</div>
                    <div className="text-[10px] text-[#717783]">Cobros combinados</div>
                  </div>
                </div>
                <div className="text-right font-bold font-mono text-[#1B1B1B] text-sm">
                  ${shift.totalMixedSales.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[4px] bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1B1B1B]">Ventas a Crédito (Por Cobrar)</div>
                    <div className="text-[10px] text-[#717783]">Cargado a cartera de clientes</div>
                  </div>
                </div>
                <div className="text-right font-bold font-mono text-[#1B1B1B] text-sm">
                  ${shift.totalCreditSales.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-center text-xs">
            <span className="font-bold text-[#5C5C5C]">Total Transaccionado:</span>
            <span className="font-bold font-mono text-[#0067C0] text-base">
              ${totalSalesAll.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right: Cash In/Out Manual Movements Table */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wider">
              Movimientos Manuales de Caja
            </h3>
            <span className="text-[11px] text-[#717783]">Gastos menores e ingresos</span>
          </div>

          <div className="flex-1 overflow-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F9] text-[#1B1B1B] font-semibold text-[11px] uppercase tracking-wider border-b border-[#E5E5E5] sticky top-0">
                <tr>
                  <th className="py-2 px-3">HORA</th>
                  <th className="py-2 px-3">TIPO</th>
                  <th className="py-2 px-3">CONCEPTO / MOTIVO</th>
                  <th className="py-2 px-3 text-right">MONTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {cashMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#717783]">
                      No hay salidas o entradas manuales en este turno
                    </td>
                  </tr>
                ) : (
                  cashMovements.map((mov) => {
                    const isIncome = mov.type === 'INGRESO'
                    return (
                      <tr key={mov.id} className="even:bg-[#FDFDFD] hover:bg-[#F9F9F9]">
                        <td className="py-2 px-3 font-mono text-[11px] text-[#5C5C5C]">
                          {mov.timestamp}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isIncome
                                ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                                : 'bg-red-50 text-[#C42B1C] border border-red-200'
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#1B1B1B] font-medium">{mov.concept}</td>
                        <td
                          className={`py-2 px-3 text-right font-mono font-bold ${
                            isIncome ? 'text-[#107C41]' : 'text-[#C42B1C]'
                          }`}
                        >
                          {isIncome ? `+$${mov.amount.toFixed(2)}` : `-$${mov.amount.toFixed(2)}`}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: New Cash Expense/Income */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                {modalType === 'INGRESO' ? 'Registrar Entrada de Efectivo' : 'Registrar Gasto Manual'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMovement}>
              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-base font-bold font-mono text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">
                    Justificación o Concepto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Compra de papelería, pago de flete, cambio..."
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] focus:border-[#0067C0]"
                  />
                </div>
              </div>

              <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] cursor-pointer"
                >
                  Cancelar [ESC]
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-[4px] shadow-xs cursor-pointer ${
                    modalType === 'INGRESO'
                      ? 'bg-[#107C41] hover:bg-[#0F7B0F]'
                      : 'bg-[#C42B1C] hover:bg-red-700'
                  }`}
                >
                  Registrar en Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apertura de Turno */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-sm bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">Apertura de Nuevo Turno</h3>
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1B1B1B] mb-1">
                  Monto Fondo Inicial de Caja ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xl font-bold font-mono text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0]"
                />
              </div>
              <p className="text-[11px] text-[#717783]">
                Este monto servirá de base para el cambio en la gaveta y se registrará en el reporte de apertura.
              </p>
            </div>

            <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert(`Nuevo turno abierto con fondo inicial de $${newOpeningBalance.toFixed(2)}`)
                  setIsOpenShiftModalOpen(false)
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs cursor-pointer"
              >
                Abrir Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Close Shift / Corte Z */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-lg bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">Corte de Caja (Cierre de Turno Z)</h3>
                <p className="text-[11px] text-[#717783]">Arqueo físico de billetes y monedas</p>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmClose}>
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5]">
                  <div>
                    <span className="text-[#5C5C5C] block">Efectivo Calculado:</span>
                    <span className="text-lg font-bold font-mono text-[#0067C0]">
                      ${expectedCashInDrawer.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5C5C5C] block">Ventas Totales:</span>
                    <span className="text-lg font-bold font-mono text-[#1B1B1B]">
                      ${totalSalesAll.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">
                    Efectivo Real Contado en Gaveta ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    value={countedCash || ''}
                    onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xl font-bold font-mono text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] focus:border-[#0067C0]"
                  />
                </div>

                <div
                  className={`p-3 rounded-[4px] border text-xs flex items-center justify-between ${
                    cashDifference === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : cashDifference > 0
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cashDifference === 0 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="font-semibold">
                      {cashDifference === 0
                        ? 'Cuadre perfecto: Sin faltante ni sobrante'
                        : cashDifference > 0
                          ? 'Sobrante en caja:'
                          : 'Faltante en caja:'}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-sm">
                    ${Math.abs(cashDifference).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-between items-center">
                <label className="flex items-center gap-2 text-xs text-[#1B1B1B] cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-[#D1D1D1] text-[#0067C0]" />
                  <span>Imprimir comprobante Z (80mm)</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCloseModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] rounded-[4px] shadow-xs cursor-pointer"
                  >
                    Confirmar Cierre de Turno
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashShiftView
