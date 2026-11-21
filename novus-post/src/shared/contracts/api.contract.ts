import type {
  Product,
  ProductInput,
  ProductFilter,
  ProductPageQuery,
  ProductPageResult,
  ProductCatalogStatsDelta
} from './product.contract'
import type { TaxesApi } from './tax.contract'
import type { Brand, BrandInput, BrandFilter } from './brand.contract'
import type { Supplier, SupplierInput, SupplierFilter } from './supplier.contract'
import type { ProductType, ProductTypeInput, ProductTypeFilter } from './product-type.contract'
import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter,
  ProductBarcodePreviewInput,
  ProductBarcodeLabelInput
} from './product-barcode.contract'
import type {
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter
} from './product-price-tier.contract'
import type { ComboItem, ComboItemInput, ComboItemFilter } from './combo-item.contract'
import type { ProductBatch, ProductBatchInput, ProductBatchFilter } from './product-batch.contract'
import type {
  AdjustStockInput,
  AdjustStockResult,
  KardexMovementQuery,
  KardexMovementPage,
  KardexExportFormat
} from './inventory.contract'
import type { Category, CategoryInput, CategoryFilter } from './category.contract'
import type { AuthApi } from './auth.contract'
import type { UsersApi } from './user.contract'
import type { SettingsApi } from './settings.contract'
import type { HardwareApi } from './hardware.contract'
import type { CustomersApi } from './customer.contract'
import type { SalesApi } from './sales.contract'
import type { ExchangeRateApi } from './exchange-rate.contract'
import type { CashApi } from './cash.contract'
import type { ReportsApi } from './reports.contract'
import type { DatabaseMaintenanceApi } from './database.contract'
import type { IssueReportsApi } from './issue-report.contract'

/**
 * Nombres canónicos de los canales IPC.
 * Formato: `<dominio>:<accion>`.
 */
export const IPC_CHANNELS = {
  products: {
    list: 'products:list',
    listPage: 'products:listPage',
    getById: 'products:getById',
    listVariants: 'products:listVariants',
    create: 'products:create',
    update: 'products:update',
    softDelete: 'products:softDelete',
    toggleStatus: 'products:toggleStatus'
  },
  taxes: {
    list: 'taxes:list',
    create: 'taxes:create',
    update: 'taxes:update',
    remove: 'taxes:remove',
    setDefault: 'taxes:setDefault'
  },
  brands: {
    list: 'brands:list',
    getById: 'brands:getById',
    create: 'brands:create',
    update: 'brands:update',
    softDelete: 'brands:softDelete',
    toggleStatus: 'brands:toggleStatus'
  },
  suppliers: {
    list: 'suppliers:list',
    getById: 'suppliers:getById',
    create: 'suppliers:create',
    update: 'suppliers:update',
    softDelete: 'suppliers:softDelete',
    toggleStatus: 'suppliers:toggleStatus'
  },
  productTypes: {
    list: 'productTypes:list',
    getById: 'productTypes:getById',
    create: 'productTypes:create',
    update: 'productTypes:update',
    softDelete: 'productTypes:softDelete',
    toggleStatus: 'productTypes:toggleStatus'
  },
  productBarcodes: {
    list: 'productBarcodes:list',
    create: 'productBarcodes:create',
    update: 'productBarcodes:update',
    softDelete: 'productBarcodes:softDelete',
    toggleStatus: 'productBarcodes:toggleStatus',
    previewLabel: 'productBarcodes:previewLabel',
    printLabels: 'productBarcodes:printLabels',
    downloadLabelsPdf: 'productBarcodes:downloadLabelsPdf'
  },
  productPriceTiers: {
    list: 'productPriceTiers:list',
    create: 'productPriceTiers:create',
    update: 'productPriceTiers:update',
    softDelete: 'productPriceTiers:softDelete',
    toggleStatus: 'productPriceTiers:toggleStatus'
  },
  comboItems: {
    list: 'comboItems:list',
    create: 'comboItems:create',
    update: 'comboItems:update',
    softDelete: 'comboItems:softDelete',
    toggleStatus: 'comboItems:toggleStatus'
  },
  productBatches: {
    list: 'productBatches:list',
    receive: 'productBatches:receive',
    update: 'productBatches:update',
    softDelete: 'productBatches:softDelete'
  },
  inventory: {
    adjustStock: 'inventory:adjustStock',
    listMovements: 'inventory:listMovements',
    exportMovements: 'inventory:exportMovements'
  },
  sales: {
    complete: 'sales:complete',
    listSuspended: 'sales:listSuspended',
    suspend: 'sales:suspend',
    deleteSuspended: 'sales:deleteSuspended'
  },
  exchangeRate: {
    getUsdVes: 'exchangeRate:getUsdVes',
    getEurVes: 'exchangeRate:getEurVes'
  },
  cash: {
    getRegister: 'cash:getRegister',
    openShift: 'cash:openShift',
    closeShift: 'cash:closeShift',
    addMovement: 'cash:addMovement',
    returnSale: 'cash:returnSale'
  },
  reports: {
    getDashboard: 'reports:getDashboard',
    getCustomerDetail: 'reports:getCustomerDetail'
  },
  issueReports: {
    submit: 'issueReports:submit'
  },
  database: {
    getStatus: 'database:getStatus',
    listBackups: 'database:listBackups',
    createBackup: 'database:createBackup',
    verifyIntegrity: 'database:verifyIntegrity',
    optimize: 'database:optimize',
    restoreBackup: 'database:restoreBackup'
  },
  categories: {
    list: 'categories:list',
    create: 'categories:create',
    update: 'categories:update',
    softDelete: 'categories:softDelete',
    toggleStatus: 'categories:toggleStatus'
  },
  auth: {
    login: 'auth:login',
    loginPin: 'auth:loginPin',
    logout: 'auth:logout',
    getCurrentUser: 'auth:getCurrentUser',
    sendOtp: 'auth:sendOtp',
    verifyOtp: 'auth:verifyOtp',
    resetPassword: 'auth:resetPassword'
  },
  users: {
    list: 'users:list',
    getById: 'users:getById',
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete',
    toggleStatus: 'users:toggleStatus'
  },
  settings: {
    getBusiness: 'settings:getBusiness',
    updateBusiness: 'settings:updateBusiness',
    testSmtp: 'settings:testSmtp',
    sendInvoiceEmail: 'settings:sendInvoiceEmail'
  },
  hardware: {
    listPorts: 'hardware:listPorts',
    openPort: 'hardware:openPort',
    closePort: 'hardware:closePort',
    readWeight: 'hardware:readWeight',
    isConnected: 'hardware:isConnected',
    saveScaleConfig: 'hardware:saveScaleConfig',
    getScaleConfig: 'hardware:getScaleConfig'
  },
  customers: {
    list: 'customers:list',
    getById: 'customers:getById',
    create: 'customers:create',
    update: 'customers:update',
    delete: 'customers:delete',
    toggleStatus: 'customers:toggleStatus',
    getAccountSummary: 'customers:getAccountSummary',
    recordPayment: 'customers:recordPayment',
    listDebts: 'customers:listDebts',
    listPayments: 'customers:listPayments',
    applyPaymentToDebt: 'customers:applyPaymentToDebt'
  },
  appWindow: {
    minimize: 'appWindow:minimize',
    toggleMaximize: 'appWindow:toggleMaximize',
    close: 'appWindow:close'
  }
} as const

export interface ProductsApi {
  list(filter?: ProductFilter): Promise<Product[]>
  listPage(query: ProductPageQuery): Promise<ProductPageResult>
  getById(id: string): Promise<Product | null>
  listVariants(parentId: string): Promise<Product[]>
  create(input: ProductInput): Promise<Product>
  update(product: Product): Promise<Product>
  softDelete(id: string): Promise<ProductCatalogStatsDelta>
  toggleStatus(id: string): Promise<Product>
}

export interface BrandsApi {
  list(filter?: BrandFilter): Promise<Brand[]>
  getById(id: string): Promise<Brand | null>
  create(input: BrandInput): Promise<Brand>
  update(brand: Brand): Promise<Brand>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Brand>
}

export interface SuppliersApi {
  list(filter?: SupplierFilter): Promise<Supplier[]>
  getById(id: string): Promise<Supplier | null>
  create(input: SupplierInput): Promise<Supplier>
  update(supplier: Supplier): Promise<Supplier>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Supplier>
}

export interface ProductTypesApi {
  list(filter?: ProductTypeFilter): Promise<ProductType[]>
  getById(id: string): Promise<ProductType | null>
  create(input: ProductTypeInput): Promise<ProductType>
  update(type: ProductType): Promise<ProductType>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<ProductType>
}

export interface ProductBarcodesApi {
  list(filter?: ProductBarcodeFilter): Promise<ProductBarcode[]>
  create(input: ProductBarcodeInput): Promise<ProductBarcode>
  update(barcode: ProductBarcode): Promise<ProductBarcode>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<ProductBarcode>
  previewLabel(input: ProductBarcodePreviewInput): Promise<string>
  printLabels(input: ProductBarcodeLabelInput): Promise<void>
  downloadLabelsPdf(input: ProductBarcodeLabelInput): Promise<boolean>
}

export interface ProductPriceTiersApi {
  list(filter?: ProductPriceTierFilter): Promise<ProductPriceTier[]>
  create(input: ProductPriceTierInput): Promise<ProductPriceTier>
  update(tier: ProductPriceTier): Promise<ProductPriceTier>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<ProductPriceTier>
}

export interface ComboItemsApi {
  list(filter?: ComboItemFilter): Promise<ComboItem[]>
  create(input: ComboItemInput): Promise<ComboItem>
  update(item: ComboItem): Promise<ComboItem>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<ComboItem>
}

export interface ProductBatchesApi {
  list(filter?: ProductBatchFilter): Promise<ProductBatch[]>
  receive(input: ProductBatchInput): Promise<ProductBatch>
  update(batch: ProductBatch): Promise<ProductBatch>
  softDelete(id: string): Promise<void>
}

export interface InventoryApi {
  adjustStock(input: AdjustStockInput): Promise<AdjustStockResult>
  listMovements(query: KardexMovementQuery): Promise<KardexMovementPage>
  exportMovements(query: KardexMovementQuery, format: KardexExportFormat): Promise<boolean>
}

export interface CategoriesApi {
  list(filter?: CategoryFilter): Promise<Category[]>
  create(input: CategoryInput): Promise<Category>
  update(category: Category): Promise<Category>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Category>
}

/** Control de la ventana nativa desde el header del renderer (minimizar/maximizar/cerrar). */
export interface AppWindowApi {
  minimize(): Promise<void>
  toggleMaximize(): Promise<boolean>
  close(): Promise<void>
}

/** Superficie completa expuesta en `window.api` por el preload. */
export interface NovusApi {
  products: ProductsApi
  taxes: TaxesApi
  brands: BrandsApi
  suppliers: SuppliersApi
  productTypes: ProductTypesApi
  productBarcodes: ProductBarcodesApi
  productPriceTiers: ProductPriceTiersApi
  comboItems: ComboItemsApi
  productBatches: ProductBatchesApi
  inventory: InventoryApi
  categories: CategoriesApi
  auth: AuthApi
  users: UsersApi
  settings: SettingsApi
  hardware: HardwareApi
  customers: CustomersApi
  sales: SalesApi
  exchangeRate: ExchangeRateApi
  cash: CashApi
  reports: ReportsApi
  issueReports: IssueReportsApi
  database: DatabaseMaintenanceApi
  appWindow: AppWindowApi
}

/** Alias retrocompatible para el contrato de la API. */
export type NexusApi = NovusApi
