import POSView from '../../features/pos/POSView'
import ProductTable from '../../features/inventory/components/ProductTable'
import KardexView from '../../features/kardex/KardexView'
import CashShiftView from '../../features/cash-shift/CashShiftView'
import CustomersView from '../../features/customers/CustomersView'
import ReportsView from '../../features/reports/ReportsView'
import SettingsGrid from '../../features/settings/SettingsGrid'

export type TabId = 'pos' | 'products' | 'kardex' | 'cash' | 'customers' | 'reports' | 'settings'

export interface TabConfig {
  id: TabId
  label: string
  hotkey: string
  component: React.ComponentType<any>
}

export const TABS_CONFIG: TabConfig[] = [
  { id: 'pos', label: 'Venta (POS)', hotkey: 'F1', component: POSView },
  { id: 'products', label: 'Productos', hotkey: 'F2', component: ProductTable },
  { id: 'kardex', label: 'Kardex', hotkey: 'F3', component: KardexView },
  { id: 'cash', label: 'Caja', hotkey: 'F4', component: CashShiftView },
  { id: 'customers', label: 'Clientes', hotkey: 'F5', component: CustomersView },
  { id: 'reports', label: 'Reportes', hotkey: 'F6', component: ReportsView },
  { id: 'settings', label: 'Ajustes', hotkey: 'F7', component: SettingsGrid },
]
