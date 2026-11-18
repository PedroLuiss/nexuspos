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
  effective_stock: number | null
  min_stock: number
  max_stock: number | null
  unit: string
  parent_id: string | null
  attributes: string | null
  variant_attrs: string | null
  brand_id: string | null
  brand_name: string | null
  supplier_id: string | null
  supplier_name: string | null
  type_id: string | null
  type_name: string | null
  type_kind: string | null
  tax_id: string | null
  tax_name: string | null
  tax_rate: number | null
  has_tax: number
  active: number
  deleted: number
  description: string
  image_url?: string | null
  created_at: string
  updated_at: string
}

/**
 * Producto + relaciones resueltas (migraciones 015, 016, 019).
 * Para combos, el stock disponible se deriva de sus componentes:
 *   MIN( stock_componento / cantidad_por_combo )
 * de modo que el POS y el backend validen disponibilidad con el mismo número.
 */
const SELECT_PRODUCTS = `
  SELECT p.*,
    b.name AS brand_name,
    s.name AS supplier_name,
    t.name AS type_name,
    t.kind AS type_kind,
    tx.name AS tax_name,
    tx.rate AS tax_rate,
    CASE
      WHEN t.kind = 'combo' THEN
        COALESCE((
          SELECT MIN(CAST(cp.stock / ci.quantity AS INTEGER))
          FROM combo_items ci
          JOIN products cp ON cp.id = ci.component_id
          WHERE ci.combo_id = p.id AND ci.deleted = 0 AND ci.active = 1 AND cp.deleted = 0
        ), 0)
      ELSE p.stock
    END AS effective_stock
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
  LEFT JOIN product_types t ON t.id = p.type_id
  LEFT JOIN taxes tx ON tx.id = p.tax_id
`

function mapRow(row: ProductRow): Product {
  const hasTax =
    row.tax_rate === null || row.tax_rate === undefined ? Boolean(row.has_tax) : row.tax_rate > 0

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    stock: row.effective_stock ?? row.stock,
    minStock: row.min_stock,
    maxStock: row.max_stock ?? undefined,
    unit: row.unit,
    parentId: row.parent_id ?? undefined,
    attributes: row.attributes ?? undefined,
    variantAttrs: row.variant_attrs ?? undefined,
    brandId: row.brand_id ?? undefined,
    brandName: row.brand_name ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    supplierName: row.supplier_name ?? undefined,
    typeId: row.type_id ?? undefined,
    typeName: row.type_name ?? undefined,
    typeKind: (row.type_kind as Product['typeKind']) ?? undefined,
    taxId: row.tax_id ?? undefined,
    taxName: row.tax_name ?? undefined,
    taxRate: row.tax_rate ?? undefined,
    hasTax,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    description: row.description,
    imageUrl: row.image_url && row.image_url.trim().length > 0 ? row.image_url : undefined,
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

    if (!filter?.includeDeleted) clauses.push('p.deleted = 0')
    if (filter?.onlyActive) clauses.push('p.active = 1')
    if (filter?.category) {
      clauses.push('p.category = @category')
      params.category = filter.category
    }
    if (filter?.brandId) {
      clauses.push('p.brand_id = @brandId')
      params.brandId = filter.brandId
    }
    if (filter?.supplierId) {
      clauses.push('p.supplier_id = @supplierId')
      params.supplierId = filter.supplierId
    }
    if (filter?.typeId) {
      clauses.push('p.type_id = @typeId')
      params.typeId = filter.typeId
    }
    if (filter?.search) {
      clauses.push('(p.code LIKE @search OR p.name LIKE @search OR p.category LIKE @search)')
      params.search = `%${filter.search}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`${SELECT_PRODUCTS} ${where} ORDER BY p.name COLLATE NOCASE ASC`)
      .all(params) as ProductRow[]

    return rows.map(mapRow)
  }

  findById(id: string): Product | null {
    const row = this.db.prepare(`${SELECT_PRODUCTS} WHERE p.id = ?`).get(id) as
      ProductRow | undefined
    return row ? mapRow(row) : null
  }

  findByCode(code: string): Product | null {
    const row = this.db.prepare(`${SELECT_PRODUCTS} WHERE p.code = ?`).get(code) as
      ProductRow | undefined
    return row ? mapRow(row) : null
  }

  findByParentId(parentId: string): Product[] {
    const rows = this.db
      .prepare(
        `${SELECT_PRODUCTS} WHERE p.parent_id = ? AND p.deleted = 0 ORDER BY p.name COLLATE NOCASE ASC`
      )
      .all(parentId) as ProductRow[]
    return rows.map(mapRow)
  }

  create(input: ProductInput & { id: string; createdAt: string; updatedAt: string }): Product {
    this.db
      .prepare(
        `INSERT INTO products (
          id, code, name, category, cost_price, sale_price, stock, min_stock, max_stock,
          unit, parent_id, attributes, variant_attrs, brand_id, supplier_id, type_id, tax_id, has_tax, active, deleted, description, image_url, created_at, updated_at
        ) VALUES (
          @id, @code, @name, @category, @costPrice, @salePrice, @stock, @minStock, @maxStock,
          @unit, @parentId, @attributes, @variantAttrs, @brandId, @supplierId, @typeId, @taxId, @hasTax, @active, @deleted, @description, @imageUrl, @createdAt, @updatedAt
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
        parentId: input.parentId ?? null,
        attributes: input.attributes ?? '',
        variantAttrs: input.variantAttrs ?? '',
        brandId: input.brandId ?? null,
        supplierId: input.supplierId ?? null,
        typeId: input.typeId ?? null,
        taxId: input.taxId ?? null,
        hasTax: input.hasTax ? 1 : 0,
        active: input.active ? 1 : 0,
        deleted: input.deleted ? 1 : 0,
        description: input.description ?? '',
        imageUrl: input.imageUrl ?? '',
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
          parent_id = @parentId,
          attributes = @attributes,
          variant_attrs = @variantAttrs,
          brand_id = @brandId,
          supplier_id = @supplierId,
          type_id = @typeId,
          tax_id = @taxId,
          has_tax = @hasTax,
          active = @active,
          deleted = @deleted,
          description = @description,
          image_url = @imageUrl,
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
        parentId: product.parentId ?? null,
        attributes: product.attributes ?? '',
        variantAttrs: product.variantAttrs ?? '',
        brandId: product.brandId ?? null,
        supplierId: product.supplierId ?? null,
        typeId: product.typeId ?? null,
        taxId: product.taxId ?? null,
        hasTax: product.hasTax ? 1 : 0,
        active: product.active ? 1 : 0,
        deleted: product.deleted ? 1 : 0,
        description: product.description ?? '',
        imageUrl: product.imageUrl ?? '',
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
      .prepare(
        'UPDATE products SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?'
      )
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
