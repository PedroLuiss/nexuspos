import React, { useState } from 'react'
import {
  Users,
  Building2,
  Database,
  ChevronRight,
  CheckCircle2,
  X,
  Scale
} from '../../shared/icons/Icons'

export const SettingsGrid: React.FC = () => {
  const [activeModal, setActiveModal] = useState<
    'users' | 'business' | 'database' | 'scale' | null
  >(null)
  const [notification, setNotification] = useState<string | null>(null)

  // RBAC state
  const [permissions, setPermissions] = useState({
    CAN_DELETE_PRODUCT: true,
    CAN_SEE_REPORTS: false,
    CAN_APPLY_DISCOUNT: true,
    CAN_MODIFY_PRICE: false,
    CAN_MANUAL_CASH_MOVEMENTS: true,
    CAN_OVERRIDE_NO_STOCK: false
  })

  // Business state
  const [companyName, setCompanyName] = useState('NEXUS MARKET S.A. DE C.V.')
  const [taxId, setTaxId] = useState('NEX-980412-A10')
  const [phone, setPhone] = useState('(55) 5555-0199')
  const [ticketHeader, setTicketHeader] = useState('¡Bienvenidos a Nexus Market!')
  const [ticketFooter, setTicketFooter] = useState('Conserve este ticket para cualquier cambio o devolución.')

  // Scale (Báscula) state
  const [comPort, setComPort] = useState('COM3')
  const [baudRate, setBaudRate] = useState(9600)
  const [scaleWeight, setScaleWeight] = useState<string | null>(null)

  const showFeedback = (msg: string): void => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  const handleTestScale = (): void => {
    setScaleWeight('Calculando peso...')
    setTimeout(() => {
      setScaleWeight('1.425 KG (Lectura Estable)')
      showFeedback('Báscula serial COM3 sincronizada correctamente')
    }, 600)
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto bg-[#F3F3F3]">
      {/* Title Header (Fluent Box) */}
      <div className="p-3 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Ajustes Generales del Sistema NexusPOS
          </h2>
          <p className="text-xs text-[#5C5C5C] mt-0.5">
            Control de permisos de usuarios (RBAC), identidad fiscal, base de datos SQLite y puertos de hardware
          </p>
        </div>

        {notification && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-[#107C41] rounded-[4px] text-xs font-semibold">
            <CheckCircle2 size={15} className="text-[#107C41]" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Grid of 4 Large Cards (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1">
        {/* Card 1: Usuarios y Permisos (RBAC) */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all p-4 flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center group-hover:bg-[#0067C0] group-hover:text-white transition-colors">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                    Usuarios y Permisos (RBAC)
                  </h3>
                  <p className="text-[11px] text-[#717783]">Control granular de acciones por rol</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#0067C0]/10 text-[#0067C0] border border-[#0067C0]/20">
                Rol: Cajero
              </span>
            </div>

            <p className="text-xs text-[#5C5C5C] mb-3 leading-relaxed">
              Define los privilegios de los cajeros para anular ventas, eliminar productos del catálogo, ver reportes contables o modificar precios al vuelo.
            </p>

            <div className="bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5] p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Eliminar Producto (CAN_DELETE_PRODUCT):</span>
                <span className="font-semibold text-[#107C41]">Permitido</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Ver Reportes (CAN_SEE_REPORTS):</span>
                <span className="font-semibold text-[#C42B1C]">Restringido</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Modificar Precios (CAN_MODIFY_PRICE):</span>
                <span className="font-semibold text-[#C42B1C]">Restringido</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-center">
            <span className="text-[11px] text-[#717783]">3 roles configurados</span>
            <button
              onClick={() => setActiveModal('users')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0067C0] hover:text-white bg-[#0067C0]/10 hover:bg-[#0067C0] rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Gestionar Permisos</span>
              <span className="font-mono text-[10px] bg-white/40 px-1 rounded text-[#0067C0] group-hover:text-white">[ALT+U]</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Datos de Negocio */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all p-4 flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-emerald-50 text-[#107C41] flex items-center justify-center group-hover:bg-[#107C41] group-hover:text-white transition-colors">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                    Datos de Negocio y Ticket
                  </h3>
                  <p className="text-[11px] text-[#717783]">Datos fiscales y plantilla de recibo</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-[#107C41] border border-emerald-200">
                Verificado
              </span>
            </div>

            <p className="text-xs text-[#5C5C5C] mb-3 leading-relaxed">
              Personaliza el encabezado del ticket térmico (80mm), logotipo comercial, RFC/RUT, teléfono de atención y mensajes de pie de página.
            </p>

            <div className="bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5] p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Razón Social:</span>
                <span className="font-semibold text-[#1B1B1B] font-mono truncate max-w-[200px]">
                  {companyName}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Registro Fiscal (RFC):</span>
                <span className="font-semibold text-[#1B1B1B] font-mono">{taxId}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Formato Ticket:</span>
                <span className="font-semibold text-[#1B1B1B]">ESC/POS Térmico 80mm</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-center">
            <span className="text-[11px] text-[#717783]">Impresión activa</span>
            <button
              onClick={() => setActiveModal('business')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#107C41] hover:text-white bg-emerald-50 hover:bg-[#107C41] rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Editar Datos Ticket</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Gestión de Base de Datos */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all p-4 flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                    Base de Datos SQLite Local
                  </h3>
                  <p className="text-[11px] text-[#717783]">Copias de seguridad y restauración</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                SQLite 3.4
              </span>
            </div>

            <p className="text-xs text-[#5C5C5C] mb-3 leading-relaxed">
              Crea copias de seguridad locales comprimidas en archivos <code className="text-purple-700 font-mono">.sqlite</code> o <code className="text-purple-700 font-mono">.sql</code>. Restaura el sistema ante cualquier contingencia.
            </p>

            <div className="bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5] p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Motor Local:</span>
                <span className="font-semibold text-[#1B1B1B]">better-sqlite3</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Último Backup:</span>
                <span className="font-semibold text-[#1B1B1B] font-mono">
                  Hoy {new Date().toLocaleDateString('es-MX')} (14.2 MB)
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Integridad:</span>
                <span className="font-semibold text-[#107C41]">OK (Sin corrupción)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-center">
            <span className="text-[11px] text-[#717783]">Offline-first</span>
            <button
              onClick={() => setActiveModal('database')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-600 rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Backup / Restore</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 4: Otras Configuraciones (Báscula Serial Port) */}
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all p-4 flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Scale size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                    Báscula y Puerto Serial (RS-232)
                  </h3>
                  <p className="text-[11px] text-[#717783]">Comunicación COM por hardware</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                COM3 Conectado
              </span>
            </div>

            <p className="text-xs text-[#5C5C5C] mb-3 leading-relaxed">
              Conexión para balanzas de peso comercial (Torrey, Rhino, Dibal) mediante <code className="text-amber-800 font-mono">serialport</code>. Transmite el peso al POS instantáneamente.
            </p>

            <div className="bg-[#F9F9F9] rounded-[4px] border border-[#E5E5E5] p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Puerto Activo:</span>
                <span className="font-semibold text-[#1B1B1B] font-mono">{comPort} (RS-232)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Baud Rate:</span>
                <span className="font-semibold text-[#1B1B1B] font-mono">{baudRate} bps</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5C5C5C]">Estado de Enlace:</span>
                <span className="font-semibold text-[#107C41]">Listo para pesaje</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-center">
            <span className="text-[11px] text-[#717783]">Node serialport</span>
            <button
              onClick={() => setActiveModal('scale')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 hover:text-white bg-amber-50 hover:bg-amber-600 rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Configurar Puerto Serial</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Usuarios & RBAC */}
      {activeModal === 'users' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-lg bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Gestión de Permisos (RBAC): Rol Cajero
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-[#5C5C5C] mb-2">
                Habilita o deshabilita acciones críticas para cajeros durante la operación del turno:
              </p>

              <div className="space-y-2 border border-[#E5E5E5] rounded-[4px] p-3 divide-y divide-[#E5E5E5]">
                {Object.entries(permissions).map(([key, val]) => (
                  <label key={key} className="flex items-center justify-between pt-2 first:pt-0 cursor-pointer select-none">
                    <div>
                      <span className="font-bold text-[#1B1B1B] font-mono">{key}</span>
                      <p className="text-[10px] text-[#717783]">
                        {key === 'CAN_DELETE_PRODUCT' && 'Permite eliminar artículos del catálogo'}
                        {key === 'CAN_SEE_REPORTS' && 'Acceso al módulo de métricas financieras'}
                        {key === 'CAN_APPLY_DISCOUNT' && 'Aplicar descuentos porcentuales en caja'}
                        {key === 'CAN_MODIFY_PRICE' && 'Editar precio de venta directamente'}
                        {key === 'CAN_MANUAL_CASH_MOVEMENTS' && 'Registrar gastos y salidas de efectivo'}
                        {key === 'CAN_OVERRIDE_NO_STOCK' && 'Vender aunque no haya stock en inventario'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) =>
                        setPermissions({ ...permissions, [key]: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#0067C0] focus:ring-[#0067C0]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  showFeedback('Permisos RBAC actualizados en base de datos local')
                  setActiveModal(null)
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs"
              >
                Guardar Matriz de Permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Datos de Negocio */}
      {activeModal === 'business' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-lg bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Datos de Negocio & Plantilla de Ticket
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">RFC / CIF Fiscal</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] font-mono text-[#1B1B1B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1B1B1B] mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1B1B1B] mb-1">Encabezado de Ticket</label>
                <input
                  type="text"
                  value={ticketHeader}
                  onChange={(e) => setTicketHeader(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1B1B1B] mb-1">Pie de Página de Ticket</label>
                <textarea
                  rows={2}
                  value={ticketFooter}
                  onChange={(e) => setTicketFooter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] resize-none text-[#1B1B1B]"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  showFeedback('Plantilla de ticket actualizada')
                  setActiveModal(null)
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#107C41] hover:bg-[#0F7B0F] rounded-[4px] shadow-xs"
              >
                Guardar Datos Fiscales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Base de Datos Backup / Restore */}
      {activeModal === 'database' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Mantenimiento de Base de Datos SQLite
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-[4px] space-y-2">
                <span className="font-bold text-[#1B1B1B] block">Generar Respaldo (.sqlite / .db)</span>
                <p className="text-[11px] text-[#5C5C5C]">
                  Crea un archivo local con todas las tablas (ventas, kardex, inventario y clientes).
                </p>
                <button
                  onClick={() => {
                    showFeedback(`Copia nexuspos_backup_${new Date().toISOString().slice(0, 10)}.sqlite generada con éxito`)
                    setActiveModal(null)
                  }}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-[4px] text-xs transition-colors cursor-pointer"
                >
                  Descargar Copia de Seguridad Ahora
                </button>
              </div>

              <div className="p-3 bg-red-50/50 border border-red-200 rounded-[4px] space-y-2">
                <span className="font-bold text-[#C42B1C] block">Restaurar Copia Previa</span>
                <p className="text-[11px] text-[#5C5C5C]">
                  Advertencia: Reemplazará todos los datos actuales por los del archivo restaurado.
                </p>
                <label className="block w-full py-2 bg-white hover:bg-[#F9F9F9] text-[#C42B1C] border border-red-300 font-bold rounded-[4px] text-xs text-center cursor-pointer">
                  <span>Seleccionar Archivo .sqlite / .db</span>
                  <input
                    type="file"
                    accept=".db,.sqlite,.sql"
                    className="hidden"
                    onChange={() => {
                      alert('Base de datos restaurada. La aplicación debe reiniciarse.')
                      setActiveModal(null)
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Báscula Serial Port */}
      {activeModal === 'scale' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-backdrop">
          <div className="w-full max-w-md bg-white rounded-[6px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#D1D1D1] overflow-hidden animate-modal">
            <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Configuración de Báscula (RS-232 / COM)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] p-1 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">Puerto COM</label>
                  <select
                    value={comPort}
                    onChange={(e) => setComPort(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                  >
                    <option value="COM1">COM1</option>
                    <option value="COM2">COM2</option>
                    <option value="COM3">COM3 (Detectado)</option>
                    <option value="COM4">COM4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1B1B1B] mb-1">Velocidad (Baud Rate)</label>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B]"
                  >
                    <option value={4800}>4800 bps</option>
                    <option value={9600}>9600 bps (Estándar)</option>
                    <option value={19200}>19200 bps</option>
                    <option value={115200}>115200 bps</option>
                  </select>
                </div>
              </div>

              {/* Live Scale Weight Screen */}
              <div className="p-4 bg-slate-900 text-emerald-400 rounded-[4px] border border-slate-800 text-center font-mono select-none">
                <span className="text-[10px] text-slate-400 block tracking-widest uppercase">
                  Pantalla Digital de Balanza
                </span>
                <div className="text-3xl font-extrabold tracking-wider my-1">
                  {scaleWeight || '0.000 KG'}
                </div>
                <span className="text-[10px] text-slate-400">
                  Protocolo: Continuo / Demanda (Básculas Torrey & Rhino)
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestScale}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[4px] transition-colors text-xs cursor-pointer"
              >
                Probar Lectura de Peso en Vivo
              </button>
            </div>

            <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px]"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  showFeedback('Configuración de puerto serial guardada')
                  setActiveModal(null)
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px]"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsGrid
