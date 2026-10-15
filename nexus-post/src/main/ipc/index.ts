import { getDatabase } from '../adapters/persistence/sqlite/database'
import { runMigrations } from '../adapters/persistence/sqlite/migrations'
import { SqliteProductRepository } from '../adapters/persistence/sqlite/products.sqlite'
import { SqliteStockMovementRepository } from '../adapters/persistence/sqlite/stock-movements.sqlite'
import { SqliteCategoryRepository } from '../adapters/persistence/sqlite/categories.sqlite'
import { SqliteTransactionRunner } from '../adapters/persistence/sqlite/transaction.sqlite'
import { ProductService } from '../domain/products/product.service'
import { InventoryService } from '../domain/inventory/inventory.service'
import { CategoryService } from '../domain/categories/category.service'
import { registerProductIpc } from './products.ipc'
import { registerInventoryIpc } from './inventory.ipc'
import { registerCategoryIpc } from './categories.ipc'

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
  const transactionRunner = new SqliteTransactionRunner(db)

  const productService = new ProductService(productRepository)
  const inventoryService = new InventoryService(
    productRepository,
    stockMovementRepository,
    transactionRunner
  )
  const categoryService = new CategoryService(categoryRepository)

  registerProductIpc(productService)
  registerInventoryIpc(inventoryService)
  registerCategoryIpc(categoryService)
}
