import type { SerialPort } from 'serialport'
import { SerialPort as SerialPortClass } from 'serialport'
import type { SerialPortInfo, BaudRate, ScaleReading, HardwarePort } from '@shared/contracts'

const DEFAULT_READ_TIMEOUT_MS = 3000
const STABLE_READINGS_REQUIRED = 3
const STABILITY_THRESHOLD = 0.05 // ±50 gramos

/**
 * Adaptador de hardware para báscula serial (RS-232) usando la librería `serialport`.
 *
 * Soporta balanzas comerciales comunes (Torrey, Rhino, Dibal, etc.) que envían
 * el peso en formato continuo o por demanda a través del puerto serial.
 *
 * Si no hay balanza física conectada, las operaciones fallan de forma controlada
 * sin bloquear el POS.
 */
export class SerialScaleAdapter implements HardwarePort {
  private port: SerialPort | null = null
  private isOpen = false
  private lastReading: ScaleReading | null = null

  async listPorts(): Promise<SerialPortInfo[]> {
    try {
      const ports = await SerialPortClass.list()
      return ports.map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer ?? undefined,
        serialNumber: p.serialNumber ?? undefined,
        vendorId: p.vendorId ?? undefined,
        productId: p.productId ?? undefined
      }))
    } catch (err) {
      console.error('[SerialScaleAdapter] Error listando puertos:', err)
      return []
    }
  }

  async openPort(comPort: string, baudRate: BaudRate): Promise<void> {
    if (this.isOpen && this.port) {
      await this.closePort()
    }

    return new Promise((resolve, reject) => {
      try {
        this.port = new SerialPortClass({
          path: comPort,
          baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          autoOpen: false
        })

        this.port.open((err) => {
          if (err) {
            this.isOpen = false
            this.port = null
            reject(new Error(`No se pudo abrir el puerto ${comPort}: ${err.message}`))
            return
          }
          this.isOpen = true
          this.lastReading = null
          resolve()
        })

        // Timeout de seguridad para la apertura
        setTimeout(() => {
          if (!this.isOpen) {
            reject(new Error(`Tiempo de espera agotado abriendo ${comPort}`))
          }
        }, DEFAULT_READ_TIMEOUT_MS)
      } catch (err) {
        this.isOpen = false
        this.port = null
        reject(
          err instanceof Error
            ? new Error(`Error abriendo puerto ${comPort}: ${err.message}`)
            : new Error(`Error desconocido abriendo puerto ${comPort}`)
        )
      }
    })
  }

  async closePort(): Promise<void> {
    if (!this.port || !this.isOpen) {
      this.isOpen = false
      this.port = null
      return
    }

    return new Promise((resolve) => {
      this.port!.close((err) => {
        if (err) {
          console.error('[SerialScaleAdapter] Error cerrando puerto:', err)
        }
        this.isOpen = false
        this.port = null
        resolve()
      })
    })
  }

  async readWeight(): Promise<ScaleReading> {
    if (!this.isOpen || !this.port) {
      return {
        weightKg: 0,
        isStable: false,
        unit: 'KG',
        timestamp: new Date().toISOString(),
        error: 'Báscula no conectada. Abra el puerto serial primero.'
      }
    }

    return new Promise((resolve) => {
      const readings: number[] = []
      const startTime = Date.now()
      let buffer = ''
      const timeout = setTimeout(() => {
        this.port!.removeListener('data', onData)
        resolve(this.buildReadingFromBuffer(readings, buffer, 'Lectura por timeout'))
      }, DEFAULT_READ_TIMEOUT_MS)

      const onData = (data: Buffer) => {
        buffer += data.toString('ascii')
        const parsed = this.parseWeightFromBuffer(buffer)
        if (parsed !== null) {
          readings.push(parsed)
          buffer = ''
        }

        if (readings.length >= STABLE_READINGS_REQUIRED && this.isStable(readings)) {
          clearTimeout(timeout)
          this.port!.removeListener('data', onData)
          const reading = this.buildReadingFromBuffer(readings, buffer)
          this.lastReading = reading
          resolve(reading)
        }
      }

      this.port!.on('data', onData)

      // Limpieza si se cierra el puerto mientras esperamos
      this.port!.once('close', () => {
        clearTimeout(timeout)
        this.port!.removeListener('data', onData)
        resolve({
          weightKg: 0,
          isStable: false,
          unit: 'KG',
          timestamp: new Date().toISOString(),
          error: 'Puerto serial cerrado durante la lectura'
        })
      })
    })
  }

  isConnected(): boolean {
    return this.isOpen && this.port !== null && !this.port.destroyed
  }

  private parseWeightFromBuffer(buffer: string): number | null {
    // Balanzas comunes envían el peso como número con posible signo y decimales
    // Ejemplos: "01.425\r\n", "ST,GS,+001.425 kg\r\n", "1.425\r\n"
    const lines = buffer.split(/[\r\n]+/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Intenta extraer un número con decimales (con o senza signo)
      const match = trimmed.match(/[-+]?\d*\.?\d+/)
      if (match) {
        const value = parseFloat(match[0])
        if (!isNaN(value) && value >= 0) {
          return value
        }
      }
    }
    return null
  }

  private isStable(readings: number[]): boolean {
    if (readings.length < STABLE_READINGS_REQUIRED) return false
    const recent = readings.slice(-STABLE_READINGS_REQUIRED)
    const max = Math.max(...recent)
    const min = Math.min(...recent)
    return max - min <= STABILITY_THRESHOLD
  }

  private buildReadingFromBuffer(readings: number[], buffer: string, error?: string): ScaleReading {
    const weightKg = readings.length > 0 ? readings[readings.length - 1] : 0
    const isStable = readings.length >= STABLE_READINGS_REQUIRED && this.isStable(readings)

    return {
      weightKg,
      isStable,
      unit: 'KG',
      timestamp: new Date().toISOString(),
      error
    }
  }

  getLastReading(): ScaleReading | null {
    return this.lastReading
  }
}
