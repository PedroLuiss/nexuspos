export type TabId = 'pos' | 'products' | 'kardex' | 'cash' | 'customers' | 'reports' | 'settings'

export interface TabConfig {
  id: TabId
  label: string
  hotkey: string
}

export const TABS_CONFIG: TabConfig[] = [
  { id: 'pos', label: 'Venta (POS)', hotkey: 'ALT+1' },
  { id: 'products', label: 'Productos', hotkey: 'ALT+2' },
  { id: 'kardex', label: 'Kardex', hotkey: 'ALT+3' },
  { id: 'cash', label: 'Caja', hotkey: 'ALT+4' },
  { id: 'customers', label: 'Clientes', hotkey: 'ALT+5' },
  { id: 'reports', label: 'Reportes', hotkey: 'ALT+6' },
  { id: 'settings', label: 'Ajustes', hotkey: 'ALT+7' }
]
