import type Database from 'better-sqlite3'
import type { Product, ProductInput, ProductFilter } from '@shared/contracts'
import type { ProductRepository } from '../../../ports/product.repository'

interface ProductRow {
  id: string
  code: string
  name: string
  category: string
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
  max_stock: number | null
  unit: string
  has_tax: number
  active: number
  deleted: number
  description: string
  created_at: string
  updated_at: string
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    stock: row.stock,
    minStock: row.min_stock,
    maxStock: row.max_stock ?? undefined,
    unit: row.unit,
    hasTax: Boolean(row.has_tax),
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `ProductRepository`. */
export class SqliteProductRepository implements ProductRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: ProductFilter): Product[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('deleted = 0')
    if (filter?.onlyActive) clauses.push('active = 1')
    if (filter?.category) {
      clauses.push('category = @category')
      params.category = filter.category
    }
    if (filter?.search) {
      clauses.push('(code LIKE @search OR name LIKE @search OR category LIKE @search)')
      params.search = `%${filter.search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`SELECT * FROM products ${where} ORDER BY name COLLATE NOCASE ASC`)
      .all(params) as ProductRow[]

    return rows.map(mapRow)
  }

  findById(id: string): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as
      | ProductRow
      | undefined
    return row ? mapRow(row) : null
  }

  findByCode(code: string): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE code = ?').get(code) as
      | ProductRow
      | undefined
    return row ? mapRow(row) : null
  }

  create(input: ProductInput & { id: string; createdAt: string; updatedAt: string }): Product {
    this.db
      .prepare(
        `INSERT INTO products (
          id, code, name, category, cost_price, sale_price, stock, min_stock, max_stock,
          unit, has_tax, active, deleted, description, created_at, updated_at
        ) VALUES (
          @id, @code, @name, @category, @costPrice, @salePrice, @stock, @minStock, @maxStock,
          @unit, @hasTax, @active, @deleted, @description, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        code: input.code,
        name: input.name,
        category: input.category,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        stock: input.stock,
        minStock: input.minStock,
        maxStock: input.maxStock ?? null,
        unit: input.unit,
        hasTax: input.hasTax ? 1 : 0,
        active: input.active ? 1 : 0,
        deleted: input.deleted ? 1 : 0,
        description: input.description ?? '',
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as Product
  }

  update(product: Product): Product {
    this.db
      .prepare(
        `UPDATE products SET
          code = @code,
          name = @name,
          category = @category,
          cost_price = @costPrice,
          sale_price = @salePrice,
          stock = @stock,
          min_stock = @minStock,
          max_stock = @maxStock,
          unit = @unit,
          has_tax = @hasTax,
          active = @active,
          deleted = @deleted,
          description = @description,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock ?? null,
        unit: product.unit,
        hasTax: product.hasTax ? 1 : 0,
        active: product.active ? 1 : 0,
        deleted: product.deleted ? 1 : 0,
        description: product.description ?? '',
        updatedAt: new Date().toISOString()
      })

    return this.findById(product.id) as Product
  }

  softDelete(id: string): void {
    this.db
      .prepare('UPDATE products SET deleted = 1, active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): Product {
    this.db
      .prepare('UPDATE products SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
    return this.findById(id) as Product
  }

  setStock(id: string, stock: number): Product {
    this.db
      .prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?')
      .run(stock, new Date().toISOString(), id)
    return this.findById(id) as Product
  }
}
