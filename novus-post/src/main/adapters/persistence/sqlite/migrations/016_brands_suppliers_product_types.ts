import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Catálogos de marca, proveedor y tipo de producto.
 *
 * - `brands`: marcas de los productos.
 * - `suppliers`: proveedores de los productos.
 * - `product_types`: tipo de producto (simple, combo, service, raw_material).
 * - `products.brand_id`, `products.supplier_id`, `products.type_id`: claves foráneas opcionales.
 *
 * Se incluyen registros semilla por defecto para que ningún producto quede sin clasificación.
 */
export const migration016BrandsSuppliersProductTypes: Migration = {
  version: 16,
  name: 'brands_suppliers_product_types',
  up(db: Database.Database): void {
    const now = new Date().toISOString()

    db.exec(`
      CREATE TABLE brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_name TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE product_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'simple',
        track_stock INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      ALTER TABLE products ADD COLUMN brand_id TEXT REFERENCES brands(id);
      ALTER TABLE products ADD COLUMN supplier_id TEXT REFERENCES suppliers(id);
      ALTER TABLE products ADD COLUMN type_id TEXT REFERENCES product_types(id);

      CREATE INDEX idx_products_brand ON products(brand_id);
      CREATE INDEX idx_products_supplier ON products(supplier_id);
      CREATE INDEX idx_products_type ON products(type_id);
    `)

    const insert = <T extends Record<string, unknown>>(table: string, row: T): void => {
      const cols = Object.keys(row).join(', ')
      const placeholders = Object.keys(row).map(() => '@').join(', ')
      const params: Record<string, unknown> = {}
      Object.entries(row).forEach(([k, v], i) => {
        params[`p${i}`] = v
      })
      // Reconstruir con placeholders nombrados manualmente es más claro; usamos exec directo abajo.
      void cols
      void placeholders
      void params
    }

    // Semillas de marca
    db.prepare(`
      INSERT INTO brands (id, name, description, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @description, @active, @deleted, @createdAt, @updatedAt)
    `).run({ id: 'brand-generic', name: 'Genérica', description: 'Marca genérica sin marca específica', active: 1, deleted: 0, createdAt: now, updatedAt: now })
    db.prepare(`
      INSERT INTO brands (id, name, description, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @description, @active, @deleted, @createdAt, @updatedAt)
    `).run({ id: 'brand-nestle', name: 'Nestlé', description: '', active: 1, deleted: 0, createdAt: now, updatedAt: now })
    db.prepare(`
      INSERT INTO brands (id, name, description, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @description, @active, @deleted, @createdAt, @updatedAt)
    `).run({ id: 'brand-coca-cola', name: 'Coca-Cola', description: '', active: 1, deleted: 0, createdAt: now, updatedAt: now })

    // Semillas de proveedor
    db.prepare(`
      INSERT INTO suppliers (id, name, contact_name, phone, email, address, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @contactName, @phone, @email, @address, @active, @deleted, @createdAt, @updatedAt)
    `).run({
      id: 'supplier-general',
      name: 'Proveedor General',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      active: 1,
      deleted: 0,
      createdAt: now,
      updatedAt: now
    })
    db.prepare(`
      INSERT INTO suppliers (id, name, contact_name, phone, email, address, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @contactName, @phone, @email, @address, @active, @deleted, @createdAt, @updatedAt)
    `).run({
      id: 'supplier-distribuidora-andes',
      name: 'Distribuidora Los Andes',
      contactName: 'Carlos Méndez',
      phone: '+58 212-555.0100',
      email: 'ventas@distribuidorandes.com',
      address: 'Av. Los Andes, Caracas',
      active: 1,
      deleted: 0,
      createdAt: now,
      updatedAt: now
    })

    // Semillas de tipo de producto
    db.prepare(`
      INSERT INTO product_types (id, name, kind, track_stock, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @kind, @trackStock, @active, @deleted, @createdAt, @updatedAt)
    `).run({
      id: 'type-simple',
      name: 'Producto Simple',
      kind: 'simple',
      trackStock: 1,
      active: 1,
      deleted: 0,
      createdAt: now,
      updatedAt: now
    })
    db.prepare(`
      INSERT INTO product_types (id, name, kind, track_stock, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @kind, @trackStock, @active, @deleted, @createdAt, @updatedAt)
    `).run({
      id: 'type-combo',
      name: 'Combo / Kit',
      kind: 'combo',
      trackStock: 1,
      active: 1,
      deleted: 0,
      createdAt: now,
      updatedAt: now
    })
    db.prepare(`
      INSERT INTO product_types (id, name, kind, track_stock, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @kind, @trackStock, @active, @deleted, @createdAt, @updatedAt)
    `).run({
      id: 'type-service',
      name: 'Servicio',
      kind: 'service',
      trackStock: 0,
      active: 1,
      deleted: 0,
      createdAt: now,
      updatedAt: now
    })
    db.prepare(`
      INSERT INTO product_types (id, name, kind, track_stock, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @kind, @trackStock, @active, @deleted, @createdAt, @updatedAt)
    `).run({
      id: 'type-raw-material',
      name: 'Insumo / Materia Prima',
      kind: 'raw_material',
      trackStock: 1,
      active: 1,
      deleted: 0,
      createdAt: now,
      updatedAt: now
    })

    // Backfill: asignar valores por defecto a productos existentes
    db.exec(`
      UPDATE products SET brand_id = 'brand-generic' WHERE brand_id IS NULL;
      UPDATE products SET supplier_id = 'supplier-general' WHERE supplier_id IS NULL;
      UPDATE products SET type_id = 'type-simple' WHERE type_id IS NULL;
    `)
  }
}
