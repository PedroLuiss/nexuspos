import type { Product, ProductInput, ProductFilter } from './product.contract'
import type { AdjustStockInput, AdjustStockResult, KardexMovement } from './inventory.contract'
import type { Category, CategoryInput, CategoryFilter } from './category.contract'
import type { AuthApi } from './auth.contract'
import type { UsersApi } from './user.contract'
import type { SettingsApi } from './settings.contract'
import type { HardwareApi } from './hardware.contract'
import type { CustomersApi } from './customer.contract'
import type { SalesApi } from './sales.contract'
import type { ExchangeRateApi } from './exchange-rate.contract'

/**
 * Nombres canónicos de los canales IPC.
 * Formato: `<dominio>:<accion>`.
 */
export const IPC_CHANNELS = {
  products: {
    list: 'products:list',
    getById: 'products:getById',
    create: 'products:create',
    update: 'products:update',
    softDelete: 'products:softDelete',
    toggleStatus: 'products:toggleStatus'
  },
  inventory: {
    adjustStock: 'inventory:adjustStock',
    listMovements: 'inventory:listMovements'
  },
  sales: {
    complete: 'sales:complete',
    listSuspended: 'sales:listSuspended',
    suspend: 'sales:suspend',
    deleteSuspended: 'sales:deleteSuspended'
  },
  exchangeRate: {
    getUsdVes: 'exchangeRate:getUsdVes'
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
    updateBusiness: 'settings:updateBusiness'
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
    createCreditSale: 'customers:createCreditSale',
    applyPaymentToDebt: 'customers:applyPaymentToDebt'
  }
} as const

export interface ProductsApi {
  list(filter?: ProductFilter): Promise<Product[]>
  getById(id: string): Promise<Product | null>
  create(input: ProductInput): Promise<Product>
  update(product: Product): Promise<Product>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Product>
}

export interface InventoryApi {
  adjustStock(input: AdjustStockInput): Promise<AdjustStockResult>
  listMovements(productId?: string): Promise<KardexMovement[]>
}

export interface CategoriesApi {
  list(filter?: CategoryFilter): Promise<Category[]>
  create(input: CategoryInput): Promise<Category>
  update(category: Category): Promise<Category>
  softDelete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Category>
}

/** Superficie completa expuesta en `window.api` por el preload. */
export interface NexusApi {
  products: ProductsApi
  inventory: InventoryApi
  categories: CategoriesApi
  auth: AuthApi
  users: UsersApi
  settings: SettingsApi
  hardware: HardwareApi
  customers: CustomersApi
  sales: SalesApi
  exchangeRate: ExchangeRateApi
}
