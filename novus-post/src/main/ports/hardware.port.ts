import type { ScaleConfig, ScaleConfigInput, SerialPortInfo, BaudRate } from '@shared/contracts'
import type { ScaleReading } from '@shared/contracts'
import type { HardwarePort } from '@shared/contracts'

/**
 * Puerto de persistencia y operaciones de hardware para báscula serial (RS-232).
 * La implementación concreta vive en `main/adapters/hardware/`.
 */
export interface ScaleRepository {
  /** Obtiene la configuración guardada de la báscula. */
  getScaleConfig(): ScaleConfig | null
  /** Guarda o actualiza la configuración de la báscula. */
  saveScaleConfig(input: ScaleConfigInput, updatedBy?: string): ScaleConfig
}

export interface HardwareService {
  /** Lista los puertos seriales disponibles. */
  listPorts(): Promise<SerialPortInfo[]>
  /** Abre el puerto serial de la báscula. */
  openPort(comPort: string, baudRate: BaudRate): Promise<void>
  /** Cierra el puerto serial. */
  closePort(): Promise<void>
  /** Lee el peso de la báscula. */
  readWeight(): Promise<ScaleReading>
  /** Verifica si la báscula está conectada. */
  isConnected(): boolean
  /** Obtiene la configuración guardada. */
  getScaleConfig(): ScaleConfig | null
  /** Guarda la configuración de la báscula. */
  saveScaleConfig(input: ScaleConfigInput, updatedBy?: string): ScaleConfig
}
