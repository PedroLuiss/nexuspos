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

export type BranchTab = 'ALL' | 'NEARBY' | 'CEDI' | 'TRANSIT'

export const MOCK_BRANCHES: BranchStockInfo[] = [
  {
    id: 'br-1',
    name: 'Sucursal Central (Matriz)',
    type: 'Hipermercado',
    address: 'Av. Reforma 1234, Col. Centro',
    distanceKm: 0,
    physicalStock: 340,
    reservedStock: 20,
    phoneExt: 'Anexo 100',
    contactName: 'Laura Méndez',
    status: 'ONLINE'
  },
  {
    id: 'br-2',
    name: 'Tienda Express Norte',
    type: 'Tienda Express',
    address: 'Calz. Vallejo 880, Col. Industrial',
    distanceKm: 6.4,
    physicalStock: 120,
    reservedStock: 12,
    phoneExt: 'Anexo 205',
    contactName: 'Ana Sofía Torres',
    status: 'ONLINE'
  },
  {
    id: 'br-3',
    name: 'Sucursal Sur Coapa',
    type: 'Hipermercado',
    address: 'Av. Canal de Miramontes 2500, Coapa',
    distanceKm: 8.1,
    physicalStock: 65,
    reservedStock: 0,
    phoneExt: 'Anexo 301',
    contactName: 'Jorge Ramírez',
    status: 'ONLINE'
  },
  {
    id: 'br-4',
    name: 'CEDI Central (Almacén)',
    type: 'Centro Logístico CEDI',
    address: 'Km 32 Carretera Norte, Almacén Central',
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
