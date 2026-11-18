# 📦 MÓDULO 03 — INVENTARIO Y CATÁLOGO DE PRODUCTOS

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, diseño de base de datos y reglas de desarrollo del catálogo comercial y control de existencias de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Inventario y Productos gestiona el catálogo comercial y las existencias físicas:

- **Tabla Densa Estilo Excel (`ProductTable.tsx`):** Columnas con miniatura (32x32px), SKU / Código de barras, descripción, categoría, costo, precio de venta, stock actual con alertas visuales de mínimo/agotado, columna **Impuesto** (16% / 8% / EXENTO / SIN TASA) y switch de estado activo/inactivo. Filas densas de 40px con resaltado hover y accesibilidad por teclado.
- **Impuesto por producto (multi-alícuota):** cada producto apunta a una tasa del catálogo `taxes` mediante `tax_id`. El formulario sustituye el antiguo checkbox "IVA 8%" por un selector real (`ProductTaxField.tsx`) que muestra todas las alícuotas activas (Exento, IVA General 16%, IVA Reducido 8%, personalizadas) y calcula en vivo el precio sin/con impuesto según si el negocio trabaja con precios finales (IVA incluido) o con impuesto trasladado. El filtro de la tabla y el CSV también trabajan por tasa.
- **CRUD Completo con Soporte de Imágenes:** Creación (`AddProductModal.tsx`), edición en caliente y selector de imagen totalmente opcional. Permite subida directa local (FileReader a base64 DataURL) o URL web externa (Unsplash, CDN), con previsualización en tiempo real. **Si el producto no tiene imagen, se genera un logo automático con la primera letra del nombre en mayúscula (`ProductAvatar.tsx`)** utilizando una paleta de color armónica y determinista.
- **Unidades y precisión de existencias:** Se ofrecen pieza, unidad, kilogramo, litro, caja y paquete. Kilogramo/litro admiten stock, ajustes y ventas fraccionarias de hasta 3 decimales; pieza/unidad/caja/paquete requieren enteros. El backend valida la precisión según la unidad.
- **Soft Delete Obligatorio:** Borrado lógico (`deleted = 1`, `active = 0`) para preservar la integridad referencial y la trazabilidad histórica de Kardex y tickets pasados.
- **Entradas y Salidas Masivas de Stock (`StockAdjustmentModal.tsx` / `[ALT + E]` / `[ALT + S]`):** Recepción de mercancía por compras o bajas por merma/caducidad con motivo obligatorio e impacto directo e inmutable en el Kardex.
- **Importación y Exportación a Excel (`ProductImportExportModal.tsx`):**
  - **Exportar (`ProductExportTab.tsx`):** Descarga instantánea de catálogo a formato `.csv` con cabecera **UTF-8 BOM (`\uFEFF`)** para apertura nativa y sin corrupción de acentos en Microsoft Excel de Windows.
  - **Importar (`ProductImportTab.tsx`):** Carga masiva por lotes desde archivos Excel/CSV con parser tolerante a comillas, descarga de plantilla oficial modelo, previsualización de tabla previa a guardar y reporte detallado de errores por fila.
- **Generador de Etiquetas de Código de Barras (`BarcodeGeneratorModal.tsx` / `[ALT + B]`):** Formatos EAN-13 y Code128, resolución DPI configurable (203, 300, 600 DPI), dimensiones en milímetros y número de copias por lote para impresoras Zebra o Xprinter.
- **Gestión de Categorías (`CategoryManagerModal.tsx`):** Modal CRUD para altas, bajas y cambios en el catálogo de categorías comerciales vinculadas a los productos.
- **Catálogo Demo Sembrado (`006_seed_products.ts`):** 50 productos realistas precargados divididos en 8 categorías de abarrotes, refrescos, lácteos, panadería, limpieza y cuidado personal, con códigos EAN-13 válidos e imágenes.

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/products/                     # Entidad Product, ProductService (resuelve taxId, brandId, supplierId, typeId)
│   ├── domain/taxes/                        # Entidad TaxRate, TaxService (catálogo, ADMIN)
│   ├── domain/brands/                       # Entidad Brand, BrandService (marcas de producto)
│   ├── domain/suppliers/                    # Entidad Supplier, SupplierService (proveedores de producto)
│   ├── domain/product-types/                # Entidad ProductType, ProductTypeService (tipo: simple, combo, service, raw_material)
│   ├── domain/product-barcodes/             # Entidad ProductBarcode, ProductBarcodeService (códigos múltiples)
│   ├── domain/product-price-tiers/          # Entidad ProductPriceTier, ProductPriceTierService (escalas de mayoreo + resolver)
│   ├── domain/categories/                   # Entidad Category, CategoryService
│   ├── ports/
│   │   ├── product.repository.ts            # Puerto ProductRepository
│   │   ├── tax.repository.ts                # Puerto TaxRepository
│   │   ├── brand.repository.ts              # Puerto BrandRepository
│   │   ├── supplier.repository.ts           # Puerto SupplierRepository
│   │   ├── product-type.repository.ts       # Puerto ProductTypeRepository
│   │   ├── product-barcode.repository.ts    # Puerto ProductBarcodeRepository
│   │   ├── product-price-tier.repository.ts # Puerto ProductPriceTierRepository
│   │   └── category.repository.ts           # Puerto CategoryRepository
│   ├── adapters/persistence/sqlite/
│   │   ├── products.sqlite.ts               # Queries SQLite (CRUD + JOIN taxes, brands, suppliers, product_types)
│   │   ├── taxes.sqlite.ts                  # CRUD del catálogo de alícuotas
│   │   ├── brands.sqlite.ts                 # CRUD de marcas
│   │   ├── suppliers.sqlite.ts              # CRUD de proveedores
│   │   ├── product-types.sqlite.ts          # CRUD de tipos de producto
│   │   ├── product-barcode.sqlite.ts        # CRUD de códigos de barras múltiples
│   │   ├── product-price-tier.sqlite.ts     # CRUD de escalas de mayoreo
│   │   ├── categories.sqlite.ts             # Queries SQLite para categorías
│   │   └── migrations/                      # Migraciones versionadas
│   │       ├── 001_initial.ts               # Tabla products inicial
│   │       ├── 003_categories.ts            # Tabla categories
│   │       ├── 005_product_images.ts        # ALTER TABLE products ADD COLUMN image_url
│   │       ├── 006_seed_products.ts         # 50 productos demo + 8 categorías sembradas
│   │       ├── 015_taxes.ts                 # taxes + products.tax_id + sale_taxes + backfill
│   │       ├── 016_brands_suppliers_product_types.ts  # brands, suppliers, product_types + columnas en products
│   │       ├── 017_product_barcodes.ts      # product_barcodes + migración del código legacy
│   │       └── 018_product_price_tiers.ts   # product_price_tiers + tier de ejemplo
│   └── ipc/
│       ├── products.ipc.ts                  # Handlers 'products:*'
│       ├── taxes.ipc.ts                     # Handlers 'taxes:*'
│       ├── brands.ipc.ts                    # Handlers 'brands:*'
│       ├── suppliers.ipc.ts                 # Handlers 'suppliers:*'
│       ├── product-types.ipc.ts             # Handlers 'productTypes:*'
│       ├── product-barcode.ipc.ts           # Handlers 'productBarcodes:*'
│       ├── product-price-tier.ipc.ts        # Handlers 'productPriceTiers:*'
│       └── categories.ipc.ts                # Handlers 'categories:*'
│
├── shared/
│   ├── contracts/
│   │   ├── product.contract.ts              # Product (brandId/supplierId/typeId/taxId), ProductInput, ProductFilter
│   │   ├── tax.contract.ts                  # TaxRate, TaxInput, TaxesApi
│   │   ├── brand.contract.ts                # Brand, BrandInput, BrandFilter
│   │   ├── supplier.contract.ts             # Supplier, SupplierInput, SupplierFilter
│   │   ├── product-type.contract.ts         # ProductType, ProductTypeInput, ProductTypeFilter
│   │   ├── product-barcode.contract.ts      # ProductBarcode, ProductBarcodeInput, BarcodeFormat
│   │   ├── product-price-tier.contract.ts   # ProductPriceTier, ProductPriceTierInput
│   │   └── inventory.contract.ts            # AdjustStockInput, KardexMovement, KardexReason
│   └── lib/
│       ├── tax.ts                           # Motor de cálculo multi-tasa (main + renderer)
│       └── product-pricing.ts               # resolveUnitPrice (escalas de mayoreo) — main + renderer
│
└── renderer/src/
    ├── shared/hooks/
    │   ├── useTaxes.ts                      # Catálogo de alícuotas (inventario, POS, ajustes)
    │   ├── useBrands.ts                     # Catálogo de marcas
    │   ├── useSuppliers.ts                  # Catálogo de proveedores
    │   ├── useProductTypes.ts               # Catálogo de tipos de producto
    │   ├── useProductBarcodes.ts            # Códigos de barras de un producto
    │   ├── useAllBarcodes.ts                # Mapa código->producto para buscador del POS
    │   ├── useProductPriceTiers.ts          # Escalas de mayoreo + resolvePrice local
    │   └── useAllPriceTiers.ts              # Todas las escalas agrupadas por producto (POS)
    ├── shared/ui/
    │   └── ProductAvatar.tsx                # Logo con primera letra o miniatura de imagen
    └── features/inventory/
        ├── api/
        │   ├── products.api.ts              # Invocación IPC para productos
        │   └── categories.api.ts            # Invocación IPC para categorías
        ├── hooks/
        │   ├── useProducts.ts               # Carga reactiva de productos e integración Kardex
        │   ├── useProductFilters.ts         # Filtros por categoría, marca, proveedor, tipo, impuesto, stock y búsqueda
        │   ├── useProductForm.ts            # Validación, brandId/supplierId/typeId/taxId, imageUrl y cálculo de márgenes
        │   └── useCategories.ts             # Carga de categorías activas
        ├── lib/
        │   └── productCsv.ts                # Serialización/parseo CSV con columnas de impuesto, marca, proveedor y tipo
        └── components/
            ├── ProductTable.tsx                 # Contenedor principal de la tabla densa
            ├── ProductToolbar.tsx               # Barra de acciones [ALT+N], [ALT+E], Excel, Demos
            ├── ProductFilters.tsx               # Chips de estado, categoría, marca, proveedor, tipo e impuesto
            ├── ProductRows.tsx                  # Filas con miniatura 32x32 e icono fallback
            ├── ProductStatusBar.tsx             # Resumen inferior de SKU totales y valor inventario
            ├── AddProductModal.tsx              # Modal de nuevo/editar producto
            ├── ProductBasicFields.tsx           # Subcomponente campos básicos, marca, proveedor, tipo e imagen
            ├── ProductPricingFields.tsx         # Subcomponente precios, márgenes y bloque fiscal (impuesto)
            ├── ProductTaxField.tsx              # Selector de alícuota con precio sin/con impuesto
            ├── ProductBrandField.tsx            # Selector de marca del producto
            ├── ProductSupplierField.tsx         # Selector de proveedor del producto
            ├── ProductTypeField.tsx             # Selector de tipo de producto (simple/combo/servicio/insumo)
            ├── ProductBarcodesEditor.tsx        # Editor de códigos de barras múltiples
            ├── ProductPriceTiersEditor.tsx      # Editor de escalas de precios por mayoreo
            ├── ProductImportExportModal.tsx     # Modal contenedor de importación / exportación Excel
            ├── ProductExportTab.tsx             # Pestaña de exportación con BOM UTF-8
            ├── ProductImportTab.tsx             # Pestaña de importación CSV con preview y plantilla
            ├── StockAdjustmentModal.tsx         # Modal de ajuste de stock [ALT+E / ALT+S]
            ├── BarcodeGeneratorModal.tsx        # Generador de etiquetas e impresión de barras
            ├── StockBranchModal.tsx             # Consulta de stock multi-sucursal
            └── CategoryManagerModal.tsx         # Modal CRUD de categorías
```

---

## 3. Atajos de Teclado del Módulo

|    Atajo    | Acción                                             |
| :---------: | :------------------------------------------------- |
|   `[F2]`    | Cambiar a pestaña **Inventario & Productos**       |
| `[ALT + N]` | Abrir modal para **Nuevo Producto**                |
| `[ALT + E]` | Abrir modal de **Entradas Masivas** de stock       |
| `[ALT + S]` | Abrir modal de **Salidas Masivas / Mermas**        |
| `[ALT + B]` | Abrir modal del **Generador de Códigos de Barras** |

---

## 4. Reglas Críticas de Negocio

1. **Borrado Lógico Obligatorio:** NUNCA ejecutar `DELETE FROM products WHERE id = ?`. La eliminación se implementa como:
   ```sql
   UPDATE products SET deleted = 1, active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
   ```
2. **Cálculo Automático de Precio de Venta por % de Ganancia:** El usuario ingresa el **Precio Costo ($)** y el **% de Ganancia deseado (%)** (ej: 10%, 15%, 20%, 30%). El sistema calcula en tiempo real:
   $$\text{Ganancia } \$ = \text{Precio Costo} \times \left(\frac{\%\text{ Ganancia}}{100}\right)$$
   $$\text{Precio Venta Final} = \text{Precio Costo} \times \left(1 + \frac{\%\text{ Ganancia}}{100}\right)$$
   _(Ejemplo: Costo $100.00 con 10% de ganancia = $10.00 de ganancia y $110.00 de precio de venta final)._ También permite ajuste manual bidireccional si se requiere redondear centavos.
3. **División de Componentes:** Todos los modales y formularios deben seguir subdivididos en archivos independientes para garantizar que ninguno supere **300 líneas de código** y los hooks **200 líneas**.
4. **Formato CSV con BOM:** Al exportar a Excel, el archivo debe comenzar con el byte order mark `\uFEFF` para asegurar compatibilidad total con Excel en Windows. Columnas oficiales: `Codigo, Nombre, Categoria, PrecioCosto, PrecioVenta, Stock, StockMinimo, Unidad, Descripcion, ImpuestoNombre, ImpuestoTasa, ImagenURL`. La importación sigue aceptando el encabezado legado `TieneImpuesto` (SI/NO) y lo traduce a la tasa por defecto o a la tasa 0% (Exento).
5. **Persistencia de Imágenes:** El campo `image_url` almacena cadenas base64 (`data:image/...`) para archivos subidos localmente o URLs HTTP/HTTPS seguras para productos de catálogo web o demostración.
6. **Impuesto por producto (nunca un IVA global fijo):** todo producto guarda `tax_id` apuntando al catálogo `taxes`. Reglas:
   - Si el formulario no envía `taxId`, `ProductService` aplica la tasa predeterminada del catálogo. Si no existe ninguna, la operación falla pidiendo crearla en **Ajustes › Impuestos**.
   - `has_tax` se conserva como columna legada y se sincroniza (`rate > 0`) para reportes históricos; la UI ya no lo edita.
   - El precio mostrado al cajero depende de `business_settings.prices_include_tax`: si es `true`, el precio es final y el impuesto se desagrega; si es `false`, el impuesto se suma al total.
   - Toda la matemática fiscal vive en `src/shared/lib/tax.ts` (`computeSaleTotals`, `resolveProductTax`, `computeTaxAmountForBase`). **Prohibido duplicar fórmulas en componentes o servicios.**
   - El desglose por tasa de cada venta se persiste en `sale_taxes` y se expone como `taxBreakdown` en tickets y resultados de venta.
7. **Clasificación por marca, proveedor y tipo (migración 016):** cada producto puede asociarse opcionalmente a una marca (`brands`), un proveedor (`suppliers`) y un tipo de producto (`product_types`: simple, combo, service o raw_material). Reglas:
   - Los catálogos se gestionan desde **Ajustes › Catálogos de Producto** (solo ADMIN).
   - El nombre es único sin distinguir mayúsculas; el borrado es lógico (`deleted = 1`).
   - Una marca, proveedor o tipo no se puede eliminar si tiene productos asignados (debe reasignarse primero).
   - Al crear un producto sin indicar marca/proveedor/tipo, se aplican los valores por defecto semillados (Genérica, Proveedor General, Producto Simple).
   - El CSV de exportación/importación incluye las columnas `Marca`, `Proveedor` y `TipoProducto`, aceptando nombres textuales que se resuelven al catálogo al importar.
8. **Códigos de barras múltiples (migración 017):** cada producto puede tener varios códigos de barras (`product_barcodes`: EAN-13, EAN-8, UPC-A, Code128, Code39, ITF-14, OTRO). Uno puede marcarse como `is_primary`. El código es único entre registros no eliminados. Se gestionan en la pestaña del producto al editarlo. El buscador del POS admite buscar por cualquiera de estos códigos (ver contexto 02).
9. **Precios por mayoreo / price tiers (migración 018):** escalas `product_price_tiers` por producto (`min_quantity`, `max_quantity` opcional, `price`). Reglas:
   - Los rangos de un mismo producto no pueden solaparse (validado en `ProductPriceTierService`).
   - La resolución del precio efectivo vive en `src/shared/lib/product-pricing.ts` (`resolveUnitPrice`): entre los tiers aplicables gana el de mayor `minQuantity`; si ninguno aplica se usa `salePrice`.
   - `computeSaleTotals` (en `src/shared/lib/tax.ts`) aplica internamente los tiers recibidos en `SaleLineInput.priceTiers`, de modo que **main y renderer calculan exactamente el mismo subtotal/impuesto/total**. El backend vuelve a resolver los tiers desde SQLite antes de persistir (`SalesService` inyecta `ProductPriceTierRepository`).
   - Se gestionan en la pestaña del producto al editarlo; el POS muestra el precio de mayoreo aplicado y lo resalta frente al precio estándar.

## 5. Estado de integración operativa

- El catálogo y las categorías se consultan y modifican mediante servicios SQLite e IPC; el POS usa productos persistidos y vuelve a validar disponibilidad, precio y permisos al cobrar.
- Los ajustes manuales de existencias actualizan producto y Kardex en una transacción. Las ventas registran salidas y las devoluciones registran entradas desde el servicio de Caja.
- Los productos se desactivan/eliminan mediante baja lógica para conservar referencias de ventas y auditoría.
- El lector USB/Bluetooth se comporta como teclado: el POS busca el código recibido y agrega la coincidencia exacta al confirmar con Enter; no requiere un canal de hardware dedicado.
- El costo por artículo guardado en cada venta es un snapshot histórico para reportes/devoluciones; cambiar el costo actual del producto no debe modificar tickets anteriores.
