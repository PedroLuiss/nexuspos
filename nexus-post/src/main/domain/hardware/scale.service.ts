import type {
  ScaleConfig,
  ScaleConfigInput,
  SerialPortInfo,
  BaudRate,
  ScaleReading,
  HardwarePort
} from '@shared/contracts'
import type { ScaleRepository } from '../../ports/hardware.port'
import type { AuthService } from '../auth/auth.service'

/**
 * Servicio de dominio de la báscula serial (RS-232).
 *
 * Reglas de negocio:
 * - La lectura de estado y configuración es pública (el POS necesita saber si hay báscula).
 * - Abrir/cerrar puerto y guardar configuración requieren sesión ADMIN.
 * - La lectura de peso es pública para permitir usarla en ventas.
 */
export class ScaleService implements HardwarePort {
  private hardwarePort: HardwarePort | null = null

  constructor(
    private readonly repository: ScaleRepository,
    private readonly auth: AuthService
  ) {}

  private requireAdminSession(): { name: string } {
    const session = this.auth.getSessionUser()
    if (!session) {
      throw new Error('No hay una sesión activa. Inicie sesión nuevamente.')
    }
    if (session.role !== 'ADMIN') {
      throw new Error('Acceso denegado: solo el Administrador puede configurar la báscula.')
    }
    return { name: session.name }
  }

  private getHardwarePort(): HardwarePort {
    if (!this.hardwarePort) {
      throw new Error('El puerto de hardware no está inicializado.')
    }
    return this.hardwarePort
  }

  setHardwarePort(port: HardwarePort): void {
    this.hardwarePort = port
  }

  async listPorts(): Promise<SerialPortInfo[]> {
    return this.getHardwarePort().listPorts()
  }

  async openPort(comPort: string, baudRate: BaudRate): Promise<void> {
    this.requireAdminSession()
    const port = comPort.trim()
    if (!port) throw new Error('Seleccione un puerto serial válido.')
    this.validateBaudRate(baudRate)
    return this.getHardwarePort().openPort(port, baudRate)
  }

  async closePort(): Promise<void> {
    this.requireAdminSession()
    return this.getHardwarePort().closePort()
  }

  async readWeight(): Promise<ScaleReading> {
    return this.getHardwarePort().readWeight()
  }

  isConnected(): boolean {
    return this.getHardwarePort().isConnected()
  }

  getScaleConfig(): ScaleConfig | null {
    return this.repository.getScaleConfig()
  }

  saveScaleConfig(input: ScaleConfigInput): ScaleConfig {
    const user = this.requireAdminSession()
    const comPort = input.comPort.trim()
    if (!comPort) throw new Error('Seleccione un puerto serial válido.')
    this.validateBaudRate(input.baudRate)
    return this.repository.saveScaleConfig({ ...input, comPort }, user.name)
  }

  private validateBaudRate(baudRate: number): void {
    if (![4800, 9600, 19200, 38400, 57600, 115200].includes(baudRate)) {
      throw new Error('La velocidad de comunicación serial no está soportada.')
    }
  }
}
