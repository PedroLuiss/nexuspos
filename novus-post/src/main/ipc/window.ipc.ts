import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'

/**
 * Controles de ventana nativa solicitados desde el header del renderer.
 * Se resuelve la ventana emisora con `BrowserWindow.fromWebContents` para
 * soportar futuras ventanas satélite sin estado global.
 */
export function registerAppWindowIpc(): void {
  ipcMain.handle(IPC_CHANNELS.appWindow.minimize, (event): void => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.appWindow.toggleMaximize, (event): boolean => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return false

    if (window.isMaximized()) {
      window.unmaximize()
      return false
    }

    window.maximize()
    return true
  })

  ipcMain.handle(IPC_CHANNELS.appWindow.close, (event): void => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}
