/**
 * Contrato compartido de Hardware: Báscula y Puerto Serial (RS-232).
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, serialport ni React.
 */

/** Información de un puerto serial disponible en el sistema. */
export interface SerialPortInfo {
  /** Ruta del puerto (ej. "COM1", "COM3", "/dev/ttyUSB0"). */
  path: string
  /** Nombre amigable del dispositivo (puede ser vacío). */
  manufacturer?: string
  /** Número de serie del dispositivo (puede ser vacío). */
  serialNumber?: string
  /** ID del fabricante (vendorId). */
  vendorId?: string
  /** ID del producto (productId). */
  productId?: string
}

/** Tasas de baudios soportadas para balanzas comerciales. */
export type BaudRate = 4800 | 9600 | 19200 | 38400 | 57600 | 115200

export const BAUD_RATE_OPTIONS: { value: BaudRate; label: string }[] = [
  { value: 4800, label: '4800 bps' },
  { value: 9600, label: '9600 bps (Estándar)' },
  { value: 19200, label: '19200 bps' },
  { value: 38400, label: '38400 bps' },
  { value: 57600, label: '57600 bps' },
  { value: 115200, label: '115200 bps' }
]

/** Configuración de la báscula serial persistida en SQLite. */
export interface ScaleConfig {
  id: string
  comPort: string
  baudRate: BaudRate
  isEnabled: boolean
  updatedAt?: string
  updatedBy?: string
}

/** Datos de entrada para crear/actualizar configuración de báscula. */
export type ScaleConfigInput = Omit<ScaleConfig, 'id' | 'updatedAt' | 'updatedBy'> & { id?: string }

/** Lectura de peso de la báscula. */
export interface ScaleReading {
  /** Peso en kilogramos. */
  weightKg: number
  /** Peso estabilizado (true si la lectura es estable). */
  isStable: boolean
  /** Unidad de medida. */
  unit: 'KG' | 'LB'
  /** Timestamp de la lectura. */
  timestamp: string
  /** Mensaje de error si la lectura falló. */
  error?: string
}

/** Estado de conexión de la báscula. */
export interface ScaleConnectionStatus {
  isConnected: boolean
  comPort?: string
  baudRate?: BaudRate
  lastReading?: ScaleReading
  error?: string
}

/** Puerto de hardware para báscula serial. */
export interface HardwarePort {
  /** Lista los puertos seriales disponibles en el sistema. */
  listPorts(): Promise<SerialPortInfo[]>
  /** Abre el puerto serial con la configuración dada. */
  openPort(comPort: string, baudRate: BaudRate): Promise<void>
  /** Cierra el puerto serial abierto. */
  closePort(): Promise<void>
  /** Lee el peso actual de la báscula. */
  readWeight(): Promise<ScaleReading>
  /** Verifica si el puerto está conectado. */
  isConnected(): boolean
}

/** API expuesta al renderer para hardware/báscula. */
export interface HardwareApi {
  listPorts(): Promise<SerialPortInfo[]>
  openPort(comPort: string, baudRate: BaudRate): Promise<void>
  closePort(): Promise<void>
  readWeight(): Promise<ScaleReading>
  isConnected(): Promise<ScaleConnectionStatus>
  saveScaleConfig(input: ScaleConfigInput): Promise<ScaleConfig>
  getScaleConfig(): Promise<ScaleConfig>
}
