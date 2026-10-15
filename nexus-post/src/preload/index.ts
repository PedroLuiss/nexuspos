import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  NexusApi,
  Product,
  ProductFilter,
  ProductInput,
  AdjustStockInput,
  Category,
  CategoryInput,
  CategoryFilter
} from '@shared/contracts'

// Custom APIs for renderer
const api: NexusApi = {
  products: {
    list: (filter?: ProductFilter) => ipcRenderer.invoke(IPC_CHANNELS.products.list, filter),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.products.getById, id),
    create: (input: ProductInput) => ipcRenderer.invoke(IPC_CHANNELS.products.create, input),
    update: (product: Product) => ipcRenderer.invoke(IPC_CHANNELS.products.update, product),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.products.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.products.toggleStatus, id)
  },
  inventory: {
    adjustStock: (input: AdjustStockInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.inventory.adjustStock, input),
    listMovements: (productId?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.inventory.listMovements, productId)
  },
  categories: {
    list: (filter?: CategoryFilter) => ipcRenderer.invoke(IPC_CHANNELS.categories.list, filter),
    create: (input: CategoryInput) => ipcRenderer.invoke(IPC_CHANNELS.categories.create, input),
    update: (category: Category) => ipcRenderer.invoke(IPC_CHANNELS.categories.update, category),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.categories.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.categories.toggleStatus, id)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
