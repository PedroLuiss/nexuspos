import type { BusinessConfig } from '@shared/contracts'
import { Building2, Database, Percent, Scale, Truck, Users, Package } from '../../../shared/icons/Icons'
import { getCurrencySymbol } from '../../../shared/lib/businessConfig'
import SettingsCard from './SettingsCard'

export type SettingsModalAction = 'users' | 'business' | 'tax' | 'catalogs' | 'database' | 'scale'

export interface ScaleConfigView {
  comPort: string
  baudRate: number
  isEnabled: boolean
  isConnected: boolean
}

interface SettingsCardsProps {
  isAdmin: boolean
  userCount: number
  activeUsers: number
  activeAdmins: number
  business: BusinessConfig
  isConfigLoading: boolean
  scaleConfig: ScaleConfigView
  onOpenModal: (modal: SettingsModalAction) => void
}

export function SettingsCards({
  isAdmin,
  userCount,
  activeUsers,
  activeAdmins,
  business,
  isConfigLoading,
  scaleConfig,
  onOpenModal
}: SettingsCardsProps): React.JSX.Element {
  const currencySymbol = getCurrencySymbol(business.currency)
  const fiscalId =
    business.taxIdType === 'NONE'
      ? 'Sin identificación fiscal'
      : `${business.taxIdType}: ${business.taxId || '—'}`
  const adminBadge = isAdmin
    ? { label: 'Administrador', className: 'bg-[#0067C0]/10 text-[#0067C0] border-[#0067C0]/20' }
    : { label: 'Solo Admin', className: 'bg-slate-100 text-slate-500 border-slate-200' }
  const restrictedHint = isAdmin ? undefined : 'Solo Administrador'

  return (
    <div className="grid flex-1 grid-cols-1 gap-2.5 md:grid-cols-2">
      <SettingsCard
        icon={<Users size={22} />}
        title="Usuarios, Roles y Permisos"
        subtitle="Control granular de acceso por módulo"
        accent="blue"
        badge={adminBadge}
        description="Registre cajeros y supervisores, asigne su rol comercial y habilite los módulos y acciones críticas que podrá usar durante el turno."
        facts={[
          {
            label: 'Usuarios registrados:',
            value: isAdmin ? `${userCount} (${activeUsers} activos)` : 'Requiere sesión ADMIN'
          },
          { label: 'Administradores activos:', value: isAdmin ? activeAdmins : '—' },
          {
            label: 'Acceso al submódulo:',
            value: isAdmin ? 'Habilitado' : 'Solo Administrador',
            valueClassName: isAdmin ? 'text-[#107C41] font-mono' : 'text-[#C42B1C] font-mono'
          }
        ]}
        footerNote={isAdmin ? 'Permisos guardados' : 'Requiere sesión ADMIN'}
        actionLabel="Gestionar Usuarios"
        actionHotkey="ALT+U"
        onAction={() => onOpenModal('users')}
        disabled={!isAdmin}
        disabledHint={restrictedHint}
      />

      <SettingsCard
        icon={<Building2 size={22} />}
        title="Datos del Negocio y Ticket"
        subtitle="Identidad fiscal, propietario y comprobante"
        accent="green"
        badge={{
          label: isConfigLoading ? 'Cargando…' : business.taxIdType,
          className: 'bg-emerald-50 text-[#107C41] border-emerald-200'
        }}
        description="Razón social, identificación fiscal, propietario, contacto, domicilio, moneda y plantilla del ticket térmico de 80mm."
        facts={[
          {
            label: 'Razón Social:',
            value: business.legalName || '—',
            valueClassName: 'font-mono max-w-[200px]'
          },
          { label: 'Propietario:', value: business.ownerName || '—' },
          { label: 'ID Fiscal:', value: fiscalId, valueClassName: 'font-mono' },
          {
            label: 'Moneda:',
            value: `${business.currency} (${currencySymbol})`,
            valueClassName: 'font-mono'
          }
        ]}
        footerNote={isAdmin ? 'Configuración guardada' : 'Solo lectura'}
        actionLabel="Editar Datos"
        actionHotkey="ALT+A"
        onAction={() => onOpenModal('business')}
        disabled={!isAdmin}
        disabledHint={restrictedHint}
      />

      <SettingsCard
        icon={<Percent size={22} />}
        title="Impuestos y Facturación"
        subtitle="Catálogo de alícuotas por producto"
        accent="amber"
        badge={
          business.taxEnabled
            ? {
                label: `${business.taxName} ${business.taxRate}% · predeterminada`,
                className: 'bg-amber-50 text-amber-700 border-amber-200'
              }
            : { label: 'Desactivado', className: 'bg-slate-100 text-slate-500 border-slate-200' }
        }
        description="Administre el catálogo de alícuotas (Exento, IVA General, reducido y personalizadas). Cada producto traslada su propia tasa y el ticket muestra el desglose."
        facts={[
          {
            label: 'Estado del impuesto:',
            value: business.taxEnabled ? 'Activo' : 'Desactivado',
            valueClassName: business.taxEnabled ? 'text-[#107C41]' : 'text-slate-500'
          },
          {
            label: 'Tasa predeterminada:',
            value: business.taxEnabled ? `${business.taxName} ${business.taxRate}%` : '—',
            valueClassName: 'font-mono'
          },
          {
            label: 'Tratamiento del precio:',
            value: business.pricesIncludeTax ? 'Impuesto incluido' : 'Se suma al subtotal',
            valueClassName: 'font-mono'
          }
        ]}
        footerNote={isAdmin ? 'Configuración tributaria' : 'Solo lectura'}
        actionLabel="Configurar Impuestos"
        actionHotkey="ALT+T"
        onAction={() => onOpenModal('tax')}
        disabled={!isAdmin}
        disabledHint={restrictedHint}
      />

      <SettingsCard
        icon={<Package size={22} />}
        title="Catálogos de Producto"
        subtitle="Marcas, proveedores y tipos"
        accent="blue"
        badge={{
          label: isAdmin ? 'Editable' : 'Solo lectura',
          className: isAdmin
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }}
        description="Gestione marcas, proveedores y tipos de producto (simple, combo, servicio, insumo) para clasificar el catálogo."
        facts={[]}
        footerNote={isAdmin ? 'Configuración de catálogos' : 'Solo lectura'}
        actionLabel="Gestionar Catálogos"
        onAction={() => onOpenModal('catalogs')}
        disabled={!isAdmin}
        disabledHint={restrictedHint}
      />

      <SettingsCard
        icon={<Database size={22} />}
        title="Respaldo y recuperación"
        subtitle="Copias de seguridad y mantenimiento"
        accent="purple"
        badge={{
          label: isAdmin ? 'Herramientas ADMIN' : 'Solo Administrador',
          className: isAdmin
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }}
        description="Consulte el estado operativo, cree copias de seguridad, realice mantenimiento o restaure una copia con protección preventiva."
        facts={[
          {
            label: 'Estado:',
            value: 'Consultar en el centro de mantenimiento'
          },
          { label: 'Envío remoto:', value: 'Pendiente de configuración' }
        ]}
        footerNote={isAdmin ? 'Herramientas de mantenimiento' : 'Solo Administrador'}
        actionLabel="Abrir mantenimiento"
        onAction={() => onOpenModal('database')}
        disabled={!isAdmin}
        disabledHint={restrictedHint}
      />

      <SettingsCard
        icon={<Scale size={22} />}
        title="Báscula y Puerto Serial (RS-232)"
        subtitle="Comunicación COM por hardware"
        accent="amber"
        badge={{
          label: scaleConfig.isConnected ? 'Conectado' : 'Desconectado',
          className: scaleConfig.isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }}
        description="Conexión para balanzas de peso comercial (Torrey, Rhino, Dibal) mediante puerto serial. Transmite el peso al POS."
        facts={[
          { label: 'Puerto COM:', value: scaleConfig.comPort, valueClassName: 'font-mono' },
          {
            label: 'Baud Rate:',
            value: `${scaleConfig.baudRate} bps`,
            valueClassName: 'font-mono'
          },
          {
            label: 'Estado de Enlace:',
            value: scaleConfig.isConnected ? 'Conectado' : 'Desconectado',
            valueClassName: scaleConfig.isConnected
              ? 'text-[#107C41] font-mono'
              : 'text-slate-500 font-mono'
          }
        ]}
        footerNote={scaleConfig.isEnabled ? 'Habilitada en POS' : 'Deshabilitada'}
        actionLabel="Configurar Puerto Serial"
        onAction={() => onOpenModal('scale')}
        disabled={!isAdmin}
        disabledHint={restrictedHint}
      />
    </div>
  )
}
