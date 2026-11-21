import type Database from 'better-sqlite3'
import type {
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter
} from '@shared/contracts'
import type { ProductPriceTierRepository } from '../../../ports/product-price-tier.repository'

interface ProductPriceTierRow {
  id: string
  product_id: string
  min_quantity: number
  max_quantity: number | null
  price: number
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

function mapRow(row: ProductPriceTierRow): ProductPriceTier {
  return {
    id: row.id,
    productId: row.product_id,
    minQuantity: row.min_quantity,
    maxQuantity: row.max_quantity ?? undefined,
    price: row.price,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Adaptador SQLite del puerto `ProductPriceTierRepository`. */
export class SqliteProductPriceTierRepository implements ProductPriceTierRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filter?: ProductPriceTierFilter): ProductPriceTier[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (!filter?.includeDeleted) clauses.push('deleted = 0')
    if (filter?.onlyActive) clauses.push('active = 1')
    if (filter?.productId) {
      clauses.push('product_id = @productId')
      params.productId = filter.productId
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(
        `SELECT * FROM product_price_tiers ${where} ORDER BY min_quantity ASC`
      )
      .all(params) as ProductPriceTierRow[]

    return rows.map(mapRow)
  }

  findById(id: string): ProductPriceTier | null {
    const row = this.db
      .prepare('SELECT * FROM product_price_tiers WHERE id = ?')
      .get(id) as ProductPriceTierRow | undefined
    return row ? mapRow(row) : null
  }

  findByProductId(productId: string): ProductPriceTier[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM product_price_tiers WHERE product_id = ? ORDER BY min_quantity ASC'
      )
      .all(productId) as ProductPriceTierRow[]
    return rows.map(mapRow)
  }

  create(
    input: ProductPriceTierInput & { id: string; createdAt: string; updatedAt: string }
  ): ProductPriceTier {
    this.db
      .prepare(
        `INSERT INTO product_price_tiers (
          id, product_id, min_quantity, max_quantity, price, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @productId, @minQuantity, @maxQuantity, @price, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id: input.id,
        productId: input.productId,
        minQuantity: input.minQuantity,
        maxQuantity: input.maxQuantity ?? null,
        price: input.price,
        active: input.active ? 1 : 0,
        deleted: 0,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      })

    return this.findById(input.id) as ProductPriceTier
  }

  update(tier: ProductPriceTier): ProductPriceTier {
    this.db
      .prepare(
        `UPDATE product_price_tiers SET
          product_id = @productId,
          min_quantity = @minQuantity,
          max_quantity = @maxQuantity,
          price = @price,
          active = @active,
          deleted = @deleted,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: tier.id,
        productId: tier.productId,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity ?? null,
        price: tier.price,
        active: tier.active ? 1 : 0,
        deleted: tier.deleted ? 1 : 0,
        updatedAt: new Date().toISOString()
      })

    return this.findById(tier.id) as ProductPriceTier
  }

  softDelete(id: string): void {
    this.db
      .prepare(
        'UPDATE product_price_tiers SET deleted = 1, active = 0, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): ProductPriceTier {
    this.db
      .prepare(
        'UPDATE product_price_tiers SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), id)
    return this.findById(id) as ProductPriceTier
  }
}
