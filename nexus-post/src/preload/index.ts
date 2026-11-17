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
  CategoryFilter,
  LoginInput,
  PinLoginInput,
  VerifyOtpInput,
  ResetPasswordInput,
  CreateUserInput,
  UpdateUserInput,
  BusinessConfigInput,
  ScaleConfigInput,
  BaudRate,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerPaymentInput,
  CreateCreditSaleInput,
  ApplyPaymentToDebtInput,
  CreateSaleInput,
  SuspendedSale,
  OpenCashShiftInput,
  CloseCashShiftInput,
  CreateCashMovementInput,
  ReportsQuery
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
  sales: {
    complete: (input: CreateSaleInput) => ipcRenderer.invoke(IPC_CHANNELS.sales.complete, input),
    listSuspended: () => ipcRenderer.invoke(IPC_CHANNELS.sales.listSuspended),
    suspend: (sale: SuspendedSale) => ipcRenderer.invoke(IPC_CHANNELS.sales.suspend, sale),
    deleteSuspended: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.sales.deleteSuspended, id)
  },
  exchangeRate: {
    getUsdVes: () => ipcRenderer.invoke(IPC_CHANNELS.exchangeRate.getUsdVes)
  },
  cash: {
    getRegister: (shiftId?: string) => ipcRenderer.invoke(IPC_CHANNELS.cash.getRegister, shiftId),
    openShift: (input: OpenCashShiftInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.cash.openShift, input),
    closeShift: (input: CloseCashShiftInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.cash.closeShift, input),
    addMovement: (input: CreateCashMovementInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.cash.addMovement, input),
    returnSale: (saleId: string) => ipcRenderer.invoke(IPC_CHANNELS.cash.returnSale, saleId)
  },
  reports: {
    getDashboard: (query: ReportsQuery) =>
      ipcRenderer.invoke(IPC_CHANNELS.reports.getDashboard, query),
    getCustomerDetail: (customerId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.reports.getCustomerDetail, customerId)
  },
  categories: {
    list: (filter?: CategoryFilter) => ipcRenderer.invoke(IPC_CHANNELS.categories.list, filter),
    create: (input: CategoryInput) => ipcRenderer.invoke(IPC_CHANNELS.categories.create, input),
    update: (category: Category) => ipcRenderer.invoke(IPC_CHANNELS.categories.update, category),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.categories.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.categories.toggleStatus, id)
  },
  auth: {
    login: (input: LoginInput) => ipcRenderer.invoke(IPC_CHANNELS.auth.login, input),
    loginWithPin: (input: PinLoginInput) => ipcRenderer.invoke(IPC_CHANNELS.auth.loginPin, input),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.auth.logout),
    getCurrentUser: () => ipcRenderer.invoke(IPC_CHANNELS.auth.getCurrentUser),
    sendOtp: (email: string) => ipcRenderer.invoke(IPC_CHANNELS.auth.sendOtp, email),
    verifyOtp: (input: VerifyOtpInput) => ipcRenderer.invoke(IPC_CHANNELS.auth.verifyOtp, input),
    resetPassword: (input: ResetPasswordInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.auth.resetPassword, input)
  },
  users: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.users.list),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.users.getById, id),
    create: (input: CreateUserInput) => ipcRenderer.invoke(IPC_CHANNELS.users.create, input),
    update: (input: UpdateUserInput) => ipcRenderer.invoke(IPC_CHANNELS.users.update, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.users.delete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.users.toggleStatus, id)
  },
  settings: {
    getBusiness: () => ipcRenderer.invoke(IPC_CHANNELS.settings.getBusiness),
    updateBusiness: (input: BusinessConfigInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.settings.updateBusiness, input)
  },
  hardware: {
    listPorts: () => ipcRenderer.invoke(IPC_CHANNELS.hardware.listPorts),
    openPort: (comPort: string, baudRate: BaudRate) =>
      ipcRenderer.invoke(IPC_CHANNELS.hardware.openPort, comPort, baudRate),
    closePort: () => ipcRenderer.invoke(IPC_CHANNELS.hardware.closePort),
    readWeight: () => ipcRenderer.invoke(IPC_CHANNELS.hardware.readWeight),
    isConnected: () => ipcRenderer.invoke(IPC_CHANNELS.hardware.isConnected),
    saveScaleConfig: (input: ScaleConfigInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.hardware.saveScaleConfig, input),
    getScaleConfig: () => ipcRenderer.invoke(IPC_CHANNELS.hardware.getScaleConfig)
  },
  customers: {
    list: (filter?: CustomerFilter) => ipcRenderer.invoke(IPC_CHANNELS.customers.list, filter),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.customers.getById, id),
    create: (input: CustomerInput) => ipcRenderer.invoke(IPC_CHANNELS.customers.create, input),
    update: (input: CustomerUpdateInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.update, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.customers.delete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.customers.toggleStatus, id),
    getAccountSummary: (customerId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.getAccountSummary, customerId),
    recordPayment: (input: CustomerPaymentInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.recordPayment, input),
    listDebts: (customerId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.listDebts, customerId),
    listPayments: (customerId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.listPayments, customerId),
    createCreditSale: (input: CreateCreditSaleInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.createCreditSale, input),
    applyPaymentToDebt: (input: ApplyPaymentToDebtInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.customers.applyPaymentToDebt, input)
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
