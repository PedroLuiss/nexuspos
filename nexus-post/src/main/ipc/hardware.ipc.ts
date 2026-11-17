import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { ScaleConfigInput, BaudRate } from '@shared/contracts'
import type { ScaleService } from '../domain/hardware/scale.service'

/**
 * Canales IPC de hardware y báscula serial (RS-232).
 * - Lectura de estado y configuración: disponible para cualquier sesión.
 * - Abrir/cerrar puerto y guardar configuración: solo rol ADMIN (validado en ScaleService).
 */
export function registerHardwareIpc(scaleService: ScaleService): void {
  ipcMain.handle(IPC_CHANNELS.hardware.listPorts, async () => {
    return scaleService.listPorts()
  })

  ipcMain.handle(
    IPC_CHANNELS.hardware.openPort,
    async (_event, comPort: string, baudRate: BaudRate) => {
      return scaleService.openPort(comPort, baudRate)
    }
  )

  ipcMain.handle(IPC_CHANNELS.hardware.closePort, async () => {
    return scaleService.closePort()
  })

  ipcMain.handle(IPC_CHANNELS.hardware.readWeight, async () => {
    return scaleService.readWeight()
  })

  ipcMain.handle(IPC_CHANNELS.hardware.isConnected, async () => {
    return {
      isConnected: scaleService.isConnected()
    }
  })

  ipcMain.handle(IPC_CHANNELS.hardware.saveScaleConfig, async (_event, input: ScaleConfigInput) => {
    return scaleService.saveScaleConfig(input)
  })

  ipcMain.handle(IPC_CHANNELS.hardware.getScaleConfig, async () => {
    return scaleService.getScaleConfig()
  })
}
