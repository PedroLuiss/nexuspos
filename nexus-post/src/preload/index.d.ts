import { ElectronAPI } from '@electron-toolkit/preload'
import type { NexusApi } from '@shared/contracts'

declare global {
  interface Window {
    electron: ElectronAPI
    api: NexusApi
  }
}
