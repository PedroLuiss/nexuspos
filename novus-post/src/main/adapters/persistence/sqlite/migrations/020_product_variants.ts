import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Variantes de producto (talla/color, etc.).
 *
 * - `products.parent_id`: si está presente, el producto es una variante hija de ese padre.
 * - `products.attributes`: JSON con los atributos de la variante
 *   (p. ej. [{"name":"Talla","value":"M"},{"name":"Color","value":"Rojo"}]).
 * - `products.variant_attrs`: nombres de atributos que definen el padre
 *   (p. ej. ["Talla","Color"]) — se guarda en el padre para rellenar el formulario.
 *
 * Cada variante es un producto independiente con su propio SKU, precio, stock e
 * impuestos. Se vende por separado en el POS; el padre actúa solo como agrupador.
 */
export const migration020ProductVariants: Migration = {
  version: 20,
  name: 'product_variants',
  up(db: Database.Database): void {
    db.exec(`
      ALTER TABLE products ADD COLUMN parent_id TEXT REFERENCES products(id);
      ALTER TABLE products ADD COLUMN attributes TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN variant_attrs TEXT NOT NULL DEFAULT '';

      CREATE INDEX idx_products_parent ON products(parent_id);
    `)
  }
}
