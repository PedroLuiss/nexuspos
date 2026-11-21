# 📦 MÓDULO 03 — INVENTARIO Y CATÁLOGO DE PRODUCTOS

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, diseño de base de datos y reglas de desarrollo del catálogo comercial y control de existencias de NovusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Inventario y Productos gestiona el catálogo comercial y las existencias físicas:

- **Tabla Densa Estilo Excel (`ProductTable.tsx`):** Columnas con miniatura (32x32px), SKU / Código de barras, descripción, categoría, costo, precio de venta, stock actual con alertas visuales de mínimo/agotado, columna **Impuesto** (16% / 8% / EXENTO / SIN TASA) y switch de estado activo/inactivo. Filas densas de 40px con resaltado hover y accesibilidad por teclado. La consulta pagina desde SQLite (50 por defecto; 25/50/100 configurables) y ejecuta filtros, conteo y métricas fuera del renderer.
- **Impuesto por producto (multi-alícuota):** cada producto apunta a una tasa del catálogo `taxes` mediante `tax_id`. El formulario sustituye el antiguo checkbox "IVA 8%" por un selector real (`ProductTaxField.tsx`) que muestra todas las alícuotas activas (Exento, IVA General 16%, IVA Reducido 8%, personalizadas) y calcula en vivo el precio sin/con impuesto según si el negocio trabaja con precios finales (IVA incluido) o con impuesto trasladado. El filtro de la tabla y el CSV también trabajan por tasa.
- **CRUD Completo con Soporte de Imágenes:** Creación (`AddProductModal.tsx`), edición en caliente y selector de imagen totalmente opcional. Permite subida directa local (FileReader a base64 DataURL) o URL web externa (Unsplash, CDN), con previsualización en tiempo real. **Si el producto no tiene imagen, se genera un logo automático con la primera letra del nombre en mayúscula (`ProductAvatar.tsx`)** utilizando una paleta de color armónica y determinista.
- **Permisos RBAC de acciones:** el acceso al módulo `inventory` se combina con `CAN_CREATE_PRODUCT` (alta e importación), `CAN_EDIT_PRODUCT` (ficha, categorías, códigos, variantes y combos), `CAN_DELETE_PRODUCT` (baja y activación/desactivación), `CAN_MODIFY_PRICE` (cambios de costo/precio existentes y tarifas por mayoreo) y `CAN_ADJUST_STOCK` (stock inicial distinto de cero, ajustes y operaciones de lotes). El backend valida permisos en `ProductService`, `InventoryService`, `CategoryService`, `ProductBarcodeService`, `ProductPriceTierService`, `ComboItemService` y `ProductBatchService`; ocultar botones o bloquear campos en renderer es solo una ayuda de UX, no el control de autorización. Los valores iniciales de precio forman parte del alta autorizada por `CAN_CREATE_PRODUCT`.
- **Modales responsivos:** los diálogos del módulo limitan su altura al viewport y desplazan internamente el contenido extenso; encabezados y acciones se mantienen accesibles. El formulario de producto usa una anchura máxima mayor, y tablas densas permiten desplazamiento horizontal en pantallas estrechas.
- **Unidades y precisión de existencias:** Se ofrecen pieza, unidad, kilogramo, litro, caja y paquete. Kilogramo/litro admiten stock, ajustes y ventas fraccionarias de hasta 3 decimales; pieza/unidad/caja/paquete requieren enteros. El backend valida la precisión según la unidad.
- **Precisión monetaria:** costo, precio de venta, precio por volumen y precios de variantes se capturan con dos decimales y se redondean a centavos. La precisión de stock y cantidad no se altera.
- **Soft Delete Obligatorio:** Borrado lógico (`deleted = 1`, `active = 0`) para preservar la integridad referencial y la trazabilidad histórica de Kardex y tickets pasados.
- **Entradas y Salidas Masivas de Stock (`StockAdjustmentModal.tsx` / `[ALT + E]` / `[ALT + S]`):** Recepción de mercancía por compras o bajas por merma/caducidad con motivo obligatorio e impacto directo e inmutable en el Kardex.
- **Importación y Exportación a Excel (`ProductImportExportModal.tsx`):**
  - **Exportar (`ProductExportTab.tsx`):** Descarga `.xlsx` con hojas formateadas de Productos y Resumen, además de CSV con cabecera **UTF-8 BOM (`\uFEFF`)** para Microsoft Excel de Windows. La exportación usa el catálogo completo, no solo la página visible.
  - **Importar (`ProductImportTab.tsx`):** Admite `.xlsx` y CSV (no `.xls`), con plantilla Excel formateada y hoja Guía. La previsualización se pagina; códigos repetidos/existentes, referencias no encontradas y números inválidos o negativos se reportan antes de guardar. La importación crea productos nuevos y no sobrescribe existentes.
- **Generador de Etiquetas de Código de Barras (`BarcodeGeneratorModal.tsx` / `[ALT + B]`):** Genera SVG reales con `bwip-js` para EAN-13, EAN-8, UPC-A, ITF-14, Code128, Code39 y OTRO (Code128 de respaldo). Permite seleccionar códigos guardados o usar el SKU, configurar dimensiones/margen en mm, incluir precio y generar entre 1 y 500 etiquetas. La impresión abre el diálogo nativo de Windows; también puede descargarse un PDF de páginas del tamaño configurado. No se ha probado la salida física ni el controlador sin impresora instalada.
- **Gestión de Categorías (`CategoryManagerModal.tsx`):** Modal CRUD para altas, bajas y cambios en el catálogo de categorías comerciales vinculadas a los productos.
- **Selectores de producto con búsqueda:** los formularios de componentes de combo, ajustes de stock y etiquetas filtran productos por código o nombre y muestran también el código y stock/unidad en los resultados.
- **Tablas paginadas:** la tabla del catálogo se pagina en SQLite; las tablas secundarias de categorías, lotes, códigos, componentes, escalas, variantes, sucursales y vista previa de importación muestran hasta 10 filas por página.
- **Acciones de importación/exportación y etiquetas:** el procesamiento informa avance por bloques y reporta errores de validación por fila; el catálogo completo se solicita al abrir importación/exportación o el generador de etiquetas, no al renderizar la tabla.
- **Catálogo Demo Sembrado (`006_seed_products.ts`):** 50 productos realistas precargados divididos en 8 categorías de abarrotes, refrescos, lácteos, panadería, limpieza y cuidado personal, con códigos EAN-13 válidos e imágenes.

---

## 2. Mapa de Archivos del Módulo

```text
novus-post/src/
├── main/
│   ├── domain/products/                     # Entidad Product, ProductService (resuelve taxId, brandId, supplierId, typeId)
│   ├── domain/taxes/                        # Entidad TaxRate, TaxService (catálogo, ADMIN)
│   ├── domain/brands/                       # Entidad Brand, BrandService (marcas de producto)
│   ├── domain/suppliers/                    # Entidad Supplier, SupplierService (proveedores de producto)
│   ├── domain/product-types/                # Entidad ProductType, ProductTypeService (tipo: simple, combo, service, raw_material)
│   ├── domain/product-barcodes/             # Entidad ProductBarcode, ProductBarcodeService (códigos múltiples)
│   ├── domain/product-price-tiers/          # Entidad ProductPriceTier, ProductPriceTierService (escalas de mayoreo + resolver)
│   ├── domain/combo-items/                  # Entidad ComboItem, ComboItemService (bundles + validaciones de anidamiento)
│   ├── domain/product-batches/              # Entidad ProductBatch, ProductBatchService (entradas + salidas FEFO)
│   ├── domain/categories/                   # Entidad Category, CategoryService
│   ├── ports/
│   │   ├── product.repository.ts            # Puerto ProductRepository
│   │   ├── tax.repository.ts                # Puerto TaxRepository
│   │   ├── brand.repository.ts              # Puerto BrandRepository
│   │   ├── supplier.repository.ts           # Puerto SupplierRepository
│   │   ├── product-type.repository.ts       # Puerto ProductTypeRepository
│   │   ├── product-barcode.repository.ts    # Puerto ProductBarcodeRepository
│   │   ├── product-price-tier.repository.ts # Puerto ProductPriceTierRepository
│   │   ├── combo-item.repository.ts         # Puerto ComboItemRepository
│   │   ├── product-batch.repository.ts      # Puerto ProductBatchRepository
│   │   └── category.repository.ts           # Puerto CategoryRepository
│   ├── adapters/persistence/sqlite/
│   │   ├── products.sqlite.ts               # Queries SQLite (CRUD, páginas, métricas + JOIN taxes, brands, suppliers, product_types)
│   │   ├── taxes.sqlite.ts                  # CRUD del catálogo de alícuotas
│   │   ├── brands.sqlite.ts                 # CRUD de marcas
│   │   ├── suppliers.sqlite.ts              # CRUD de proveedores
│   │   ├── product-types.sqlite.ts          # CRUD de tipos de producto
│   │   ├── product-barcode.sqlite.ts        # CRUD de códigos de barras múltiples
│   │   ├── product-price-tier.sqlite.ts     # CRUD de escalas de mayoreo
│   │   ├── combo-items.sqlite.ts            # CRUD de componentes de combo
│   │   ├── product-batch.sqlite.ts          # CRUD de lotes + SUM de stock por producto
│   │   ├── categories.sqlite.ts             # Queries SQLite para categorías (con stock derivado de combos)
│   │   └── migrations/                      # Migraciones versionadas
│   │       ├── 001_initial.ts               # Tabla products inicial
│   │       ├── 003_categories.ts            # Tabla categories
│   │       ├── 005_product_images.ts        # ALTER TABLE products ADD COLUMN image_url
│   │       ├── 006_seed_products.ts         # 50 productos demo + 8 categorías sembradas
│   │       ├── 015_taxes.ts                 # taxes + products.tax_id + sale_taxes + backfill
│   │       ├── 016_brands_suppliers_product_types.ts  # brands, suppliers, product_types + columnas en products
│   │       ├── 017_product_barcodes.ts      # product_barcodes + migración del código legacy
│   │       ├── 018_product_price_tiers.ts   # product_price_tiers + tier de ejemplo
│   │       ├── 019_combo_items.ts           # combo_items + índice único combo+componente
│   │       ├── 020_product_variants.ts      # products.parent_id / attributes / variant_attrs
│   │       ├── 021_product_batches.ts       # product_batches + products.track_batches
│   │       ├── 022_sale_item_traceability.ts # sale_items.is_combo / combo_id / batches_json
│   │       ├── 023_product_list_indexes.ts   # Índices parciales para listado por nombre/categoría
│   │       └── 024_fix_seed_barcode_format.ts # Corrige el formato del código demo heredado inválido
│   └── ipc/
│       ├── products.ipc.ts                  # Handlers 'products:*' (listPage paginada)
│       ├── taxes.ipc.ts                     # Handlers 'taxes:*'
│       ├── brands.ipc.ts                    # Handlers 'brands:*'
│       ├── suppliers.ipc.ts                 # Handlers 'suppliers:*'
│       ├── product-types.ipc.ts             # Handlers 'productTypes:*'
│       ├── product-barcode.ipc.ts           # Handlers 'productBarcodes:*'
│       ├── product-price-tier.ipc.ts        # Handlers 'productPriceTiers:*'
│       ├── combo-item.ipc.ts                # Handlers 'comboItems:*'
│       ├── product-batch.ipc.ts             # Handlers 'productBatches:*'
│       └── categories.ipc.ts                # Handlers 'categories:*'
│
├── shared/
│   ├── contracts/
│   │   ├── product.contract.ts              # Product, ProductFilter, ProductPageQuery y ProductPageResult
│   │   ├── tax.contract.ts                  # TaxRate, TaxInput, TaxesApi
│   │   ├── brand.contract.ts                # Brand, BrandInput, BrandFilter
│   │   ├── supplier.contract.ts             # Supplier, SupplierInput, SupplierFilter
│   │   ├── product-type.contract.ts         # ProductType, ProductTypeInput, ProductTypeFilter
│   │   ├── product-barcode.contract.ts      # ProductBarcode, ProductBarcodeInput, BarcodeFormat
│   │   ├── product-price-tier.contract.ts   # ProductPriceTier, ProductPriceTierInput
│   │   ├── combo-item.contract.ts           # ComboItem, ComboItemInput, ComboItemFilter
│   │   ├── product-batch.contract.ts        # ProductBatch, ProductBatchInput, ProductBatchView
│   │   └── inventory.contract.ts            # AdjustStockInput, KardexMovement, KardexReason (incluye 'COMBO')
│   └── lib/
│       ├── tax.ts                           # Motor de cálculo multi-tasa (main + renderer)
│       ├── product-pricing.ts               # resolveUnitPrice (escalas de mayoreo) — main + renderer
│       ├── product-variants.ts              # parse/serialize/format de atributos de variantes
│       ├── product-batches.ts               # issueFromBatches (FEFO/FIFO) + caducidad — main + renderer
│       └── product-barcode.ts               # validación compartida de formatos y dígitos GS1
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
    │   ├── useAllPriceTiers.ts              # Todas las escalas agrupadas por producto (POS)
    │   ├── useComboItems.ts                 # Componentes de un producto combo
    │   ├── useProductVariants.ts            # Variantes (productos hijo) de un padre
    │   └── useProductBatches.ts             # Lotes + cálculo de caducidad (re-exporta helpers)
    ├── shared/ui/
    │   └── ProductAvatar.tsx                # Logo con primera letra o miniatura de imagen
    └── features/inventory/
        ├── api/
        │   ├── products.api.ts              # Invocación IPC para productos
        │   └── categories.api.ts            # Invocación IPC para categorías
        ├── hooks/
        │   ├── useProducts.ts               # Carga de página SQLite y mutaciones del catálogo
        │   ├── useProductFilters.ts         # Estado de filtros/página y construcción del query
        │   ├── useProductFilterOptions.ts   # Opciones de filtros por catálogo
        │   ├── useTablePagination.ts        # Paginación de tablas secundarias
        │   ├── useProductForm.ts            # Validación, brandId/supplierId/typeId/taxId, imageUrl y cálculo de márgenes
        │   └── useCategories.ts             # Carga de categorías activas
        ├── lib/
        │   ├── productCsv.ts                # Serialización y parseo CSV/XLSX tabular, validación de referencias y duplicados
        │   └── productSpreadsheet.ts        # Plantilla, exportación XLSX formateada y lectura XLSX
        └── components/
            ├── ProductTable.tsx                 # Contenedor principal de la tabla densa
            ├── ProductToolbar.tsx               # Barra de acciones [ALT+N], [ALT+E], Excel, Demos
            ├── ProductFilters.tsx               # Chips de estado, categoría, marca, proveedor, tipo e impuesto
            ├── ProductRows.tsx                  # Filas de la página actual con miniatura 32x32
            ├── TablePagination.tsx               # Controles de página reutilizables
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
            ├── ComboItemsEditor.tsx             # Editor de componentes de combo (solo tipo combo)
            ├── VariantEditor.tsx                # Editor de variantes (talla/color) del producto padre
            ├── VariantForm.tsx                  # Formulario de variante (extraído para cumplir 300 líneas)
            ├── BatchEditor.tsx                  # Editor de lotes y caducidad con insignias de vencimiento
            ├── ProductImportExportModal.tsx     # Modal contenedor de importación / exportación Excel
            ├── ProductExportTab.tsx             # Exportación XLSX y CSV con BOM UTF-8
            ├── ProductImportTab.tsx             # Importación XLSX/CSV con preview y plantilla
            ├── StockAdjustmentModal.tsx         # Modal de ajuste de stock [ALT+E / ALT+S]
            ├── BarcodeGeneratorModal.tsx        # Selección de producto y coordinación de etiquetas
            ├── BarcodeLabelControls.tsx         # Configuración de formato, tamaño, margen y cantidad
            ├── BarcodeLabelPreview.tsx          # Vista previa del SVG real de código de barras
            ├── BarcodeLabelActions.tsx          # Acciones de impresión y descarga PDF
            ├── StockBranchModal.tsx             # Consulta de stock multi-sucursal
            └── CategoryManagerModal.tsx         # Modal CRUD de categorías
```

---

## 3. Atajos de Teclado del Módulo

|    Atajo    | Acción                                             |
| :---------: | :------------------------------------------------- |
| `[ALT + 2]` | Cambiar a pestaña **Inventario & Productos**       |
|   `[F2]`    | Enfocar la búsqueda del catálogo                   |
| `[ALT + N]` | Abrir modal para **Nuevo Producto**                |
| `[ALT + E]` | Abrir modal de **Entradas Masivas** de stock       |
| `[ALT + S]` | Abrir modal de **Salidas Masivas / Mermas**        |
| `[ALT + B]` | Abrir modal del **Generador de Códigos de Barras** |

---

## 4. Reglas Críticas de Negocio

1. **Borrado Lógico Obligatorio:** NUNCA ejecutar `DELETE FROM products WHERE id = ?`. La baja en cascada se ejecuta en una transacción con actualizaciones SQL por conjunto para el producto, sus variantes, lotes y relaciones de combo:
   ```sql
   UPDATE products SET deleted = 1, active = 0, updated_at = ? WHERE id = ? OR parent_id = ?
   ```
   `ProductService.softDelete()` delega a `ProductRepository.softDeleteCascade()`: evita cargar variantes, lotes y relaciones en JavaScript. La operación devuelve la variación de métricas del catálogo solo para el producto afectado, sus variantes y combos relacionados; el renderer actualiza el resumen sin recalcular el agregado completo del inventario después de cada baja. Las confirmaciones del módulo usan el `ConfirmDialog` reutilizable y asíncrono, nunca `window.confirm`.
2. **Cálculo Automático de Precio de Venta por % de Ganancia:** El usuario ingresa el **Precio Costo ($)** y el **% de Ganancia deseado (%)** (ej: 10%, 15%, 20%, 30%). El sistema calcula en tiempo real:
   $$\text{Ganancia } \$ = \text{Precio Costo} \times \left(\frac{\%\text{ Ganancia}}{100}\right)$$
   $$\text{Precio Venta Final} = \text{Precio Costo} \times \left(1 + \frac{\%\text{ Ganancia}}{100}\right)$$
   _(Ejemplo: Costo $100.00 con 10% de ganancia = $10.00 de ganancia y $110.00 de precio de venta final)._ También permite ajuste manual bidireccional si se requiere redondear centavos.
3. **División de Componentes:** Todos los modales y formularios deben seguir subdivididos en archivos independientes para garantizar que ninguno supere **300 líneas de código** y los hooks **200 líneas**.
4. **Formato Excel/CSV:** CSV exportado comienza con el BOM `\uFEFF`; `.xlsx` conserva las mismas columnas y añade hojas formateadas de resumen/guía. Columnas oficiales: `Codigo, Nombre, Categoria, Marca, Proveedor, TipoProducto, PrecioCosto, PrecioVenta, Stock, StockMinimo, Unidad, Descripcion, ImpuestoNombre, ImpuestoTasa, Atributos, PadreSKU, ImagenURL`. Se acepta el encabezado legado `TieneImpuesto` (SI/NO), traducido a tasa predeterminada o 0% (Exento). `Atributos` (JSON) y `PadreSKU` son opcionales para variantes. Solo se importan `.xlsx` y CSV; la importación crea registros nuevos y bloquea códigos duplicados, sin actualizar productos existentes.
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
   - Los cuatro IDs operativos semillados (`type-simple`, `type-combo`, `type-service`, `type-raw-material`) no se pueden renombrar, desactivar ni eliminar; sus `kind` y `trackStock` determinan reglas de stock, combos, ventas y Kardex.
   - Los tipos personalizados siempre se crean y actualizan como `simple` con control de stock, aunque se intente enviar otro `kind` por IPC. La migración 028 también normaliza tipos personalizados históricos para que no conserven accidentalmente semántica de combo o servicio.
   - Un tipo personalizado no se puede eliminar si tiene productos asignados (debe reasignarse primero). El bloqueo cuenta también productos inactivos o dados de baja, pues conservan la referencia histórica.
   - Al crear un producto sin indicar marca/proveedor/tipo, se aplican los valores por defecto semillados (Genérica, Proveedor General, Producto Simple).
   - El selector muestra y persiste el tipo simple por defecto, sin presentar una primera opción como seleccionada si su ID no está realmente en el formulario. Los tipos base muestran su semántica operativa; las nuevas clasificaciones se identifican como simples con control de stock.
   - La normalización de productos conserva los IDs seleccionados (`brandId`, `supplierId`, `typeId`) para que alta y edición persistan y devuelvan las asociaciones resueltas.
   - El CSV de exportación/importación incluye las columnas `Marca`, `Proveedor` y `TipoProducto`, aceptando nombres textuales que se resuelven al catálogo al importar.
8. **Códigos de barras múltiples (migración 017):** cada producto puede tener varios códigos de barras (`product_barcodes`: EAN-13, EAN-8, UPC-A, Code128, Code39, ITF-14, OTRO). Uno puede marcarse como `is_primary`. El código es único entre registros no eliminados. Se gestionan en la pestaña del producto al editarlo. El buscador del POS admite buscar por cualquiera de estos códigos (ver contexto 02).
   - La vista previa se genera como SVG mediante `bwip-js`; `productBarcodes:previewLabel`, `productBarcodes:printLabels` y `productBarcodes:downloadLabelsPdf` conectan renderer → preload → IPC → adaptador de hardware. El adaptador resuelve el código activo desde SQLite, valida cantidad/dimensiones y usa el diálogo de impresión de Electron o el diálogo nativo para guardar PDF. La impresión depende del controlador de Windows y no es una implementación ESC/POS/ZPL.
   - Se valida longitud/formato y dígito de control GS1 para EAN-13, EAN-8, UPC-A e ITF-14 antes de generar la vista previa, imprimir o crear el PDF. Los códigos heredados con formato/checksum inválido se rechazan con mensaje legible y deben corregirse en la ficha o cambiarse a una simbología compatible. La descarga PDF puede verificarse sin impresora; la impresión física queda pendiente de prueba con hardware real.
9. **Combos / bundles reales (migración 019):** un producto de tipo `combo` se compone de otros productos mediante `combo_items` (`combo_id`, `component_id`, `quantity` por unidad de combo). Reglas:
    - **Stock derivado:** el `stock` que ve el POS para un combo se calcula en `products.sqlite.ts` como `MIN(stock_componento / cantidad_por_combo)`; el precio cobrado es el del producto combo (sus propias escalas de mayoreo aplican si las tiene).
    - **Desglose a Kardex:** al cobrar, `SalesService` descuenta el stock de **cada componente** (`cantidad_combo × cantidad_componente`) y genera un movimiento `SALIDA` con `reason = 'COMBO'` por componente. El stock del producto combo **no** se descuenta directamente (evita doble conteo).
    - **Validaciones:** el componente no puede ser el propio combo, no se permiten combos anidados, la combinación combo+componente es única y los componentes deben existir y estar activos (`ComboItemService`).
    - **Configuración:** al guardar un producto con tipo `Combo / Kit`, el formulario espera la confirmación de persistencia y muestra el editor "Componentes del Combo" en esa misma ficha. Al editar combos ya guardados, el editor aparece al abrir la ficha. Los componentes elegibles son productos activos no-combo; el formulario verifica que el tipo devuelto por SQLite sea el seleccionado antes de continuar.
    - Si un combo se vende sin componentes configurados, el cobro se bloquea con un error.
10. **Variantes de producto (migración 020):** un producto padre puede tener variantes hijas (productos independientes con `parent_id`). Los atributos que definen las variantes se guardan en el padre (`variant_attrs`, JSON de nombres, ej. `["Talla","Color"]`) y los valores concretos en cada hija (`attributes`, JSON de pares nombre/valor). Reglas:
    - Cada variante es un producto real con su propio SKU, precio, costo, stock, impuesto y barcode; se vende por separado en el POS (no se agrega el padre).
    - `ProductService.resolveParent` valida que el padre exista, no esté eliminado y no sea a su vez una variante (prohíbe variantes anidadas).
    - El editor "Variantes" aparece en la pestaña de edición de productos no-combo que no sean variantes; permite definir los nombres de atributos y crear/editar/eliminar variantes heredando categoría, unidad, impuesto, marca y proveedor del padre.
    - Las utilidades puras `parseProductAttributes`, `serializeProductAttributes` y `formatProductAttributes` viven en `src/shared/lib/product-variants.ts`.
    - CSV: columnas `Atributos` (JSON) y `PadreSKU` (se resuelve al id del padre al importar). Las filas con `PadreSKU` se importan después de sus padres.
11. **Precios por mayoreo / price tiers (migración 018):** escalas `product_price_tiers` por producto (`min_quantity`, `max_quantity` opcional, `price`). Reglas:
   - Los rangos de un mismo producto no pueden solaparse (validado en `ProductPriceTierService`).
   - La resolución del precio efectivo vive en `src/shared/lib/product-pricing.ts` (`resolveUnitPrice`): entre los tiers aplicables gana el de mayor `minQuantity`; si ninguno aplica se usa `salePrice`.
   - `computeSaleTotals` (en `src/shared/lib/tax.ts`) aplica internamente los tiers recibidos en `SaleLineInput.priceTiers`, de modo que **main y renderer calculan exactamente el mismo subtotal/impuesto/total**. El backend vuelve a resolver los tiers desde SQLite antes de persistir (`SalesService` inyecta `ProductPriceTierRepository`).
   - Se gestionan en la pestaña del producto al editarlo; el POS muestra el precio de mayoreo aplicado y lo resalta frente al precio estándar.
12. **Lotes y caducidad (migración 021):** un producto puede activar `track_batches` para controlar stock por lotes (`product_batches`: nº de lote, cantidad, `expiration_date` opcional y fecha de entrada). Reglas:
    - El stock efectivo de un producto con lotes es la suma de sus lotes activos (`products.sqlite.ts`), de modo que el POS y el backend validan disponibilidad con el mismo número.
    - **Salidas FEFO** (First Expired, First Out): al cobrar (`SalesService.deductStock`) o al ajustar stock a la baja (`InventoryService`), se descuenta primero el lote que vence antes (los lotes sin vencimiento salen al final). Las ventas registran un movimiento Kardex por lote con el número en sus notas y snapshot; el ajuste manual registra un movimiento agregado con los lotes consumidos identificados.
    - La matemática de salida vive en `src/shared/lib/product-batches.ts` (`issueFromBatches`, `sortBatches`, `isBatchExpired`, `daysToExpiry`) — compartida por main y renderer.
    - Al activar `track_batches` en un producto con stock, se crea automáticamente un lote inicial (`INICIAL-YYYY-MM-DD`) con el stock actual para no perder inventario.
    - Las entradas de lote suman cantidad al producto; las entradas manuales de stock crean un lote `AJUSTE-YYYY-MM-DD`.
    - Se gestionan en la pestaña "Lotes y Caducidad" del formulario de producto; la UI muestra insignias de VENCIDO / vence en Nd / sin vencimiento.
13. **Servicios e insumos vendibles (auditoría de integración):** `Product` expone `trackStock` (resuelto desde `product_types.track_stock`). Los productos de tipo **Servicio** (`trackStock = false`) **no validan ni descuentan stock** en `SalesService`, `App.tsx` ni `POSView`, y no generan movimientos Kardex — antes con stock 0 eran invendibles. `InventoryService` bloquea con mensaje claro los ajustes manuales de stock sobre servicios (no manejan existencias) y sobre combos (su stock se deriva de componentes; hay que ajustar los componentes).
14. **Trazabilidad de devoluciones (migración 022) y baja en cascada:** `sale_items` guarda `is_combo`, `combo_id` y `batches_json` (lotes FEFO descontados con su `productId`). `CashService.returnSale()` usa esa información para reponer **los componentes** de un combo y **los lotes exactos** de cada línea (creando lote `DEVOLUCION-YYYY-MM-DD` si la venta es anterior a la trazabilidad). `ProductService.softDelete()` da de baja en cascada variantes, lotes y relaciones de combo, evitando huérfanos.
15. **Paginación del catálogo (migración 023):** `products:listPage` recibe filtros y página; el adaptador SQLite ejecuta `COUNT`, `LIMIT/OFFSET` y, al cargar/actualizar, calcula métricas agregadas. `ProductService` limita el tamaño de página a 100. Las tablas secundarias usan `useTablePagination` (10 elementos por defecto) para limitar filas renderizadas.
16. **Ajustes manuales de stock:** el formulario envía explícitamente `ENTRADA` o `SALIDA`; el servicio no infiere el sentido a partir del motivo, porque `DEVOLUCION` puede representar una devolución de cliente (entrada) o a proveedor (salida). El responsable se obtiene en el proceso principal desde la sesión autenticada. Las salidas se rechazan si exceden el stock disponible y producto/lotes/Kardex se actualizan en una única transacción.
17. **Snapshots para Kardex (migración 025):** cada ajuste registra unidad, origen inventario y costo de ficha en la moneda operativa como valoración referencial; las entradas/salidas con lotes registran lote o lotes consumidos. La migración 026 agrega moneda a cada snapshot y las exportaciones muestran la moneda original. Los movimientos previos conservan datos desconocidos como no disponibles.

## 5. Estado de integración operativa

- El catálogo y las categorías se consultan y modifican mediante servicios SQLite e IPC; el POS usa productos persistidos y vuelve a validar disponibilidad, precio y permisos al cobrar.
- Las mutaciones del catálogo y sus subrecursos validan en el proceso principal el permiso de módulo y la acción correspondiente. La UI oculta acciones no autorizadas, deshabilita precio/stock/estado sin permiso y evita ejecutar atajos de alta/ajuste que el usuario no tiene asignados. Las operaciones internas de ventas y devoluciones siguen actualizando inventario a través de sus propios flujos.
- El listado de Productos usa `products:listPage` (server-side). Los selectores buscables consultan una página limitada; importación/exportación solicita el catálogo completo solo al abrirse. En `App.tsx`, la carga de productos del POS se difiere hasta que el usuario autenticado entra a esa pestaña.
- Los ajustes manuales de existencias validan su dirección, stock disponible y actualizan producto/lotes y Kardex en una transacción. Las ventas registran salidas y las devoluciones registran entradas desde el servicio de Caja.
- Los productos se desactivan/eliminan mediante baja lógica para conservar referencias de ventas y auditoría.
- El lector USB/Bluetooth se comporta como teclado: el POS busca el código recibido y agrega la coincidencia exacta al confirmar con Enter; no requiere un canal de hardware dedicado.
- El costo por artículo guardado en cada venta es un snapshot histórico para reportes/devoluciones; cambiar el costo actual del producto no debe modificar tickets anteriores.
- La moneda elegida en Ajustes gobierna la visualización y captura de costos, precios, escalas por mayoreo y valores del catálogo. Al cambiarla, `SqliteCurrencyConversionRepository` convierte costos/precios de productos activos y tiers en una transacción; no modifica ventas históricas ni valoración ya registrada en Kardex.
