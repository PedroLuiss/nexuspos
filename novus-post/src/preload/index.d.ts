import { ElectronAPI } from '@electron-toolkit/preload'
import type { NovusApi } from '@shared/contracts'

declare global {
  interface Window {
    electron: ElectronAPI
    api: NovusApi
  }
}
