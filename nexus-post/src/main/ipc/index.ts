import {
  closeDatabase,
  getDatabase,
  getDatabaseFilePath
} from '../adapters/persistence/sqlite/database'
import { runMigrations } from '../adapters/persistence/sqlite/migrations'
import { SqliteProductRepository } from '../adapters/persistence/sqlite/products.sqlite'
import { SqliteTaxRepository } from '../adapters/persistence/sqlite/taxes.sqlite'
import { SqliteBrandRepository } from '../adapters/persistence/sqlite/brands.sqlite'
import { SqliteSupplierRepository } from '../adapters/persistence/sqlite/suppliers.sqlite'
import { SqliteProductTypeRepository } from '../adapters/persistence/sqlite/product-types.sqlite'
import { SqliteProductBarcodeRepository } from '../adapters/persistence/sqlite/product-barcode.sqlite'
import { SqliteProductPriceTierRepository } from '../adapters/persistence/sqlite/product-price-tier.sqlite'
import { SqliteComboItemRepository } from '../adapters/persistence/sqlite/combo-items.sqlite'
import { SqliteProductBatchRepository } from '../adapters/persistence/sqlite/product-batch.sqlite'
import { SqliteStockMovementRepository } from '../adapters/persistence/sqlite/stock-movements.sqlite'
import { SqliteCategoryRepository } from '../adapters/persistence/sqlite/categories.sqlite'
import { SqliteUserRepository } from '../adapters/persistence/sqlite/users.sqlite'
import { SqliteSettingsRepository } from '../adapters/persistence/sqlite/settings.sqlite'
import { SqliteCustomerRepository } from '../adapters/persistence/sqlite/customers.sqlite'
import { SqliteSalesRepository } from '../adapters/persistence/sqlite/sales.sqlite'
import { SqliteExchangeRateRepository } from '../adapters/persistence/sqlite/exchange-rates.sqlite'
import { SqliteCashRepository } from '../adapters/persistence/sqlite/cash.sqlite'
import { SqliteReportsRepository } from '../adapters/persistence/sqlite/reports.sqlite'
import { SqliteDatabaseMaintenanceRepository } from '../adapters/persistence/sqlite/database-maintenance.sqlite'
import { SqliteScaleRepository } from '../adapters/hardware/scale.sqlite'
import { SqliteTransactionRunner } from '../adapters/persistence/sqlite/transaction.sqlite'
import { SerialScaleAdapter } from '../adapters/hardware/scale.serial'
import { BarcodeLabelPrinter } from '../adapters/hardware/barcode-label-printer'
import { LaravelAuthAdapter } from '../adapters/remote/laravel-auth.adapter'
import { BcvExchangeRateAdapter } from '../adapters/remote/bcv-exchange-rate.adapter'
import { LaravelDatabaseBackupAdapter } from '../adapters/remote/laravel-database-backup.adapter'
import { ProductService } from '../domain/products/product.service'
import { TaxService } from '../domain/taxes/tax.service'
import { BrandService } from '../domain/brands/brand.service'
import { SupplierService } from '../domain/suppliers/supplier.service'
import { ProductTypeService } from '../domain/product-types/product-type.service'
import { ProductBarcodeService } from '../domain/product-barcodes/product-barcode.service'
import { ProductPriceTierService } from '../domain/product-price-tiers/product-price-tier.service'
import { ComboItemService } from '../domain/combo-items/combo-item.service'
import { ProductBatchService } from '../domain/product-batches/product-batch.service'
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
import { ReportsService } from '../domain/reports/reports.service'
import { DatabaseMaintenanceService } from '../domain/settings/database-maintenance.service'
import { registerProductIpc } from './products.ipc'
import { registerTaxIpc } from './taxes.ipc'
import { registerBrandIpc } from './brands.ipc'
import { registerSupplierIpc } from './suppliers.ipc'
import { registerProductTypeIpc } from './product-types.ipc'
import { registerProductBarcodeIpc } from './product-barcode.ipc'
import { registerProductPriceTierIpc } from './product-price-tier.ipc'
import { registerComboItemIpc } from './combo-items.ipc'
import { registerProductBatchIpc } from './product-batch.ipc'
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
import { registerReportsIpc } from './reports.ipc'
import { registerDatabaseIpc } from './database.ipc'
import { registerAppWindowIpc } from './window.ipc'
import { LATEST_MIGRATION_VERSION } from '../adapters/persistence/sqlite/migrations'
import { app } from 'electron'
import { join } from 'node:path'

/**
 * Composition root: inicializa persistencia, migraciones, servicios y canales IPC.
 * Se invoca una sola vez cuando Electron está listo.
 */
export function registerIpcHandlers(): void {
  const db = getDatabase()
  runMigrations(db)

  const productRepository = new SqliteProductRepository(db)
  const taxRepository = new SqliteTaxRepository(db)
  const brandRepository = new SqliteBrandRepository(db)
  const supplierRepository = new SqliteSupplierRepository(db)
  const productTypeRepository = new SqliteProductTypeRepository(db)
  const productBarcodeRepository = new SqliteProductBarcodeRepository(db)
  const productPriceTierRepository = new SqliteProductPriceTierRepository(db)
  const comboItemRepository = new SqliteComboItemRepository(db)
  const productBatchRepository = new SqliteProductBatchRepository(db)
  const stockMovementRepository = new SqliteStockMovementRepository(db)
  const categoryRepository = new SqliteCategoryRepository(db)
  const userRepository = new SqliteUserRepository(db)
  const settingsRepository = new SqliteSettingsRepository(db)
  const scaleRepository = new SqliteScaleRepository(db)
  const cashRepository = new SqliteCashRepository(db)
  const reportsRepository = new SqliteReportsRepository(db)
  const transactionRunner = new SqliteTransactionRunner(db)

  const productService = new ProductService(
    productRepository,
    taxRepository,
    brandRepository,
    supplierRepository,
    productTypeRepository,
    productBatchRepository
  )
  const brandService = new BrandService(brandRepository)
  const supplierService = new SupplierService(supplierRepository)
  const productTypeService = new ProductTypeService(productTypeRepository)
  const productBarcodeService = new ProductBarcodeService(productBarcodeRepository)
  const productPriceTierService = new ProductPriceTierService(productPriceTierRepository)
  const comboItemService = new ComboItemService(comboItemRepository, productRepository)
  const productBatchService = new ProductBatchService(productBatchRepository, productRepository)
  const authAdapter = new LaravelAuthAdapter()
  const authService = new AuthService(userRepository, authAdapter)
  const inventoryService = new InventoryService(
    productRepository,
    stockMovementRepository,
    productBatchRepository,
    authService,
    transactionRunner
  )
  const categoryService = new CategoryService(categoryRepository)
  const taxService = new TaxService(taxRepository, authService)
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
    productPriceTierRepository,
    comboItemRepository,
    productBatchRepository,
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
    comboItemRepository,
    productBatchRepository,
    stockMovementRepository,
    customerService,
    authService,
    transactionRunner
  )
  const reportsService = new ReportsService(reportsRepository, authService, customerService)
  const databaseMaintenanceService = new DatabaseMaintenanceService(
    new SqliteDatabaseMaintenanceRepository(
      db,
      join(app.getPath('userData'), 'backups'),
      LATEST_MIGRATION_VERSION,
      getDatabaseFilePath(),
      closeDatabase
    ),
    new LaravelDatabaseBackupAdapter(),
    authService
  )

  // Conectar el adaptador serial al servicio de dominio
  const serialAdapter = new SerialScaleAdapter()
  scaleService.setHardwarePort(serialAdapter)
  const barcodeLabelPrinter = new BarcodeLabelPrinter()

  registerProductIpc(productService)
  registerTaxIpc(taxService)
  registerBrandIpc(brandService)
  registerSupplierIpc(supplierService)
  registerProductTypeIpc(productTypeService)
  registerProductBarcodeIpc(productBarcodeService, productService, barcodeLabelPrinter)
  registerProductPriceTierIpc(productPriceTierService)
  registerComboItemIpc(comboItemService)
  registerProductBatchIpc(productBatchService)
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
  registerReportsIpc(reportsService)
  registerDatabaseIpc(databaseMaintenanceService)
  registerAppWindowIpc()
}
