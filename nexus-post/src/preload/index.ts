import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  NexusApi,
  Product,
  ProductFilter,
  ProductPageQuery,
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
  TaxInput,
  TaxRate,
  Brand,
  BrandInput,
  BrandFilter,
  Supplier,
  SupplierInput,
  SupplierFilter,
  ProductType,
  ProductTypeInput,
  ProductTypeFilter,
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter,
  ProductBarcodePreviewInput,
  ProductBarcodeLabelInput,
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter,
  ComboItem,
  ComboItemInput,
  ComboItemFilter,
  ProductBatch,
  ProductBatchInput,
  ProductBatchFilter,
  KardexMovementQuery,
  OpenCashShiftInput,
  CloseCashShiftInput,
  CreateCashMovementInput,
  ReportsQuery
} from '@shared/contracts'

// Custom APIs for renderer
const api: NexusApi = {
  products: {
    list: (filter?: ProductFilter) => ipcRenderer.invoke(IPC_CHANNELS.products.list, filter),
    listPage: (query: ProductPageQuery) =>
      ipcRenderer.invoke(IPC_CHANNELS.products.listPage, query),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.products.getById, id),
    listVariants: (parentId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.products.listVariants, parentId),
    create: (input: ProductInput) => ipcRenderer.invoke(IPC_CHANNELS.products.create, input),
    update: (product: Product) => ipcRenderer.invoke(IPC_CHANNELS.products.update, product),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.products.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.products.toggleStatus, id)
  },
  taxes: {
    list: (includeInactive?: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.taxes.list, includeInactive),
    create: (input: TaxInput) => ipcRenderer.invoke(IPC_CHANNELS.taxes.create, input),
    update: (tax: TaxRate) => ipcRenderer.invoke(IPC_CHANNELS.taxes.update, tax),
    remove: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.taxes.remove, id),
    setDefault: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.taxes.setDefault, id)
  },
  brands: {
    list: (filter?: BrandFilter) => ipcRenderer.invoke(IPC_CHANNELS.brands.list, filter),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.brands.getById, id),
    create: (input: BrandInput) => ipcRenderer.invoke(IPC_CHANNELS.brands.create, input),
    update: (brand: Brand) => ipcRenderer.invoke(IPC_CHANNELS.brands.update, brand),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.brands.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.brands.toggleStatus, id)
  },
  suppliers: {
    list: (filter?: SupplierFilter) => ipcRenderer.invoke(IPC_CHANNELS.suppliers.list, filter),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.suppliers.getById, id),
    create: (input: SupplierInput) => ipcRenderer.invoke(IPC_CHANNELS.suppliers.create, input),
    update: (supplier: Supplier) => ipcRenderer.invoke(IPC_CHANNELS.suppliers.update, supplier),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.suppliers.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.suppliers.toggleStatus, id)
  },
  productTypes: {
    list: (filter?: ProductTypeFilter) =>
      ipcRenderer.invoke(IPC_CHANNELS.productTypes.list, filter),
    getById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productTypes.getById, id),
    create: (input: ProductTypeInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productTypes.create, input),
    update: (type: ProductType) => ipcRenderer.invoke(IPC_CHANNELS.productTypes.update, type),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productTypes.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productTypes.toggleStatus, id)
  },
  productBarcodes: {
    list: (filter?: ProductBarcodeFilter) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.list, filter),
    create: (input: ProductBarcodeInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.create, input),
    update: (barcode: ProductBarcode) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.update, barcode),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.toggleStatus, id),
    previewLabel: (input: ProductBarcodePreviewInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.previewLabel, input),
    printLabels: (input: ProductBarcodeLabelInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.printLabels, input),
    downloadLabelsPdf: (input: ProductBarcodeLabelInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBarcodes.downloadLabelsPdf, input)
  },
  productPriceTiers: {
    list: (filter?: ProductPriceTierFilter) =>
      ipcRenderer.invoke(IPC_CHANNELS.productPriceTiers.list, filter),
    create: (input: ProductPriceTierInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productPriceTiers.create, input),
    update: (tier: ProductPriceTier) =>
      ipcRenderer.invoke(IPC_CHANNELS.productPriceTiers.update, tier),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productPriceTiers.softDelete, id),
    toggleStatus: (id: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.productPriceTiers.toggleStatus, id)
  },
  comboItems: {
    list: (filter?: ComboItemFilter) => ipcRenderer.invoke(IPC_CHANNELS.comboItems.list, filter),
    create: (input: ComboItemInput) => ipcRenderer.invoke(IPC_CHANNELS.comboItems.create, input),
    update: (item: ComboItem) => ipcRenderer.invoke(IPC_CHANNELS.comboItems.update, item),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.comboItems.softDelete, id),
    toggleStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.comboItems.toggleStatus, id)
  },
  productBatches: {
    list: (filter?: ProductBatchFilter) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBatches.list, filter),
    receive: (input: ProductBatchInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.productBatches.receive, input),
    update: (batch: ProductBatch) => ipcRenderer.invoke(IPC_CHANNELS.productBatches.update, batch),
    softDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.productBatches.softDelete, id)
  },
  inventory: {
    adjustStock: (input: AdjustStockInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.inventory.adjustStock, input),
    listMovements: (query: KardexMovementQuery) =>
      ipcRenderer.invoke(IPC_CHANNELS.inventory.listMovements, query)
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
  database: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.database.getStatus),
    listBackups: () => ipcRenderer.invoke(IPC_CHANNELS.database.listBackups),
    createBackup: () => ipcRenderer.invoke(IPC_CHANNELS.database.createBackup),
    verifyIntegrity: () => ipcRenderer.invoke(IPC_CHANNELS.database.verifyIntegrity),
    optimize: () => ipcRenderer.invoke(IPC_CHANNELS.database.optimize),
    restoreBackup: () => ipcRenderer.invoke(IPC_CHANNELS.database.restoreBackup)
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
  },
  appWindow: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.appWindow.minimize),
    toggleMaximize: () => ipcRenderer.invoke(IPC_CHANNELS.appWindow.toggleMaximize),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.appWindow.close)
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
