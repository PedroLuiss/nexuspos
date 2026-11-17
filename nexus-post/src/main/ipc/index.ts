import { getDatabase } from '../adapters/persistence/sqlite/database'
import { runMigrations } from '../adapters/persistence/sqlite/migrations'
import { SqliteProductRepository } from '../adapters/persistence/sqlite/products.sqlite'
import { SqliteStockMovementRepository } from '../adapters/persistence/sqlite/stock-movements.sqlite'
import { SqliteCategoryRepository } from '../adapters/persistence/sqlite/categories.sqlite'
import { SqliteUserRepository } from '../adapters/persistence/sqlite/users.sqlite'
import { SqliteSettingsRepository } from '../adapters/persistence/sqlite/settings.sqlite'
import { SqliteCustomerRepository } from '../adapters/persistence/sqlite/customers.sqlite'
import { SqliteSalesRepository } from '../adapters/persistence/sqlite/sales.sqlite'
import { SqliteExchangeRateRepository } from '../adapters/persistence/sqlite/exchange-rates.sqlite'
import { SqliteCashRepository } from '../adapters/persistence/sqlite/cash.sqlite'
import { SqliteScaleRepository } from '../adapters/hardware/scale.sqlite'
import { SqliteTransactionRunner } from '../adapters/persistence/sqlite/transaction.sqlite'
import { SerialScaleAdapter } from '../adapters/hardware/scale.serial'
import { LaravelAuthAdapter } from '../adapters/remote/laravel-auth.adapter'
import { BcvExchangeRateAdapter } from '../adapters/remote/bcv-exchange-rate.adapter'
import { ProductService } from '../domain/products/product.service'
import { InventoryService } from '../domain/inventory/inventory.service'
import { CategoryService } from '../domain/categories/category.service'
import { AuthService } from '../domain/auth/auth.service'
import { UserService } from '../domain/users/user.service'
import { SettingsService } from '../domain/settings/settings.service'
import { ScaleService } from '../domain/hardware/scale.service'
import { CustomerService } from '../domain/customers/customer.service'
import { SalesService } from '../domain/sales/sales.service'
import { ExchangeRateService } from '../domain/exchange-rate/exchange-rate.service'
import { CashService } from '../domain/cash/cash.service'
import { registerProductIpc } from './products.ipc'
import { registerInventoryIpc } from './inventory.ipc'
import { registerCategoryIpc } from './categories.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerUsersIpc } from './users.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerHardwareIpc } from './hardware.ipc'
import { registerCustomerIpc } from './customers.ipc'
import { registerSalesIpc } from './sales.ipc'
import { registerExchangeRateIpc } from './exchange-rate.ipc'
import { registerCashIpc } from './cash.ipc'

/**
 * Composition root: inicializa persistencia, migraciones, servicios y canales IPC.
 * Se invoca una sola vez cuando Electron está listo.
 */
export function registerIpcHandlers(): void {
  const db = getDatabase()
  runMigrations(db)

  const productRepository = new SqliteProductRepository(db)
  const stockMovementRepository = new SqliteStockMovementRepository(db)
  const categoryRepository = new SqliteCategoryRepository(db)
  const userRepository = new SqliteUserRepository(db)
  const settingsRepository = new SqliteSettingsRepository(db)
  const scaleRepository = new SqliteScaleRepository(db)
  const cashRepository = new SqliteCashRepository(db)
  const transactionRunner = new SqliteTransactionRunner(db)

  const productService = new ProductService(productRepository)
  const inventoryService = new InventoryService(
    productRepository,
    stockMovementRepository,
    transactionRunner
  )
  const categoryService = new CategoryService(categoryRepository)
  const authAdapter = new LaravelAuthAdapter()
  const authService = new AuthService(userRepository, authAdapter)
  const userService = new UserService(userRepository, authService)
  const settingsService = new SettingsService(settingsRepository, authService)
  const scaleService = new ScaleService(scaleRepository, authService)
  const customerRepository = new SqliteCustomerRepository(db)
  const customerService = new CustomerService(
    customerRepository,
    authService,
    cashRepository,
    transactionRunner
  )
  const salesRepository = new SqliteSalesRepository(db)
  const salesService = new SalesService(
    productRepository,
    stockMovementRepository,
    salesRepository,
    cashRepository,
    customerService,
    settingsRepository,
    authService,
    transactionRunner
  )
  const exchangeRateService = new ExchangeRateService(
    new SqliteExchangeRateRepository(db),
    new BcvExchangeRateAdapter()
  )
  const cashService = new CashService(
    cashRepository,
    salesRepository,
    productRepository,
    stockMovementRepository,
    customerService,
    authService,
    transactionRunner
  )

  // Conectar el adaptador serial al servicio de dominio
  const serialAdapter = new SerialScaleAdapter()
  scaleService.setHardwarePort(serialAdapter)

  registerProductIpc(productService)
  registerInventoryIpc(inventoryService)
  registerCategoryIpc(categoryService)
  registerAuthIpc(authService)
  registerUsersIpc(userService)
  registerSettingsIpc(settingsService)
  registerHardwareIpc(scaleService)
  registerCustomerIpc(customerService)
  registerSalesIpc(salesService)
  registerExchangeRateIpc(exchangeRateService)
  registerCashIpc(cashService)
}
