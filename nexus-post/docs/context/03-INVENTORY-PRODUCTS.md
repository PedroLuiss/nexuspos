# 📦 MÓDULO 03 — INVENTARIO Y CATÁLOGO DE PRODUCTOS

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, diseño de base de datos y reglas de desarrollo del catálogo comercial y control de existencias de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Inventario y Productos gestiona el catálogo comercial y las existencias físicas:
- **Tabla Densa Estilo Excel (`ProductTable.tsx`):** Columnas con miniatura (32x32px), SKU / Código de barras, descripción, categoría, costo, precio de venta, stock actual con alertas visuales de mínimo/agotado y switch de estado activo/inactivo. Filas densas de 40px con resaltado hover y accesibilidad por teclado.
- **CRUD Completo con Soporte de Imágenes:** Creación (`AddProductModal.tsx`), edición en caliente y selector de imagen totalmente opcional. Permite subida directa local (FileReader a base64 DataURL) o URL web externa (Unsplash, CDN), con previsualización en tiempo real. **Si el producto no tiene imagen, se genera un logo automático con la primera letra del nombre en mayúscula (`ProductAvatar.tsx`)** utilizando una paleta de color armónica y determinista.
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
│   ├── domain/products/                     # Entidad Product, ProductService
│   ├── domain/categories/                   # Entidad Category, CategoryService
│   ├── ports/
│   │   ├── product.repository.ts            # Puerto ProductRepository
│   │   └── category.repository.ts           # Puerto CategoryRepository
│   ├── adapters/persistence/sqlite/
│   │   ├── products.sqlite.ts               # Queries SQLite (CRUD + Soft Delete + image_url)
│   │   ├── categories.sqlite.ts             # Queries SQLite para categorías
│   │   └── migrations/                      # Migraciones versionadas
│   │       ├── 001_initial.ts               # Tabla products inicial
│   │       ├── 003_categories.ts            # Tabla categories
│   │       ├── 005_product_images.ts        # ALTER TABLE products ADD COLUMN image_url
│   │       └── 006_seed_products.ts         # 50 productos demo + 8 categorías sembradas
│   └── ipc/
│       ├── products.ipc.ts                  # Handlers 'products:*'
│       └── categories.ipc.ts                # Handlers 'categories:*'
│
├── shared/contracts/
│   ├── product.contract.ts                  # Product (con imageUrl opcional), ProductInput, ProductFilter
│   └── inventory.contract.ts                # AdjustStockInput, KardexMovement, KardexReason
│
└── renderer/src/
    ├── shared/ui/
    │   └── ProductAvatar.tsx                # Logo con primera letra o miniatura de imagen
    └── features/inventory/
    ├── api/
    │   ├── products.api.ts                  # Invocación IPC para productos
    │   └── categories.api.ts                # Invocación IPC para categorías
    ├── hooks/
    │   ├── useProducts.ts                   # Carga reactiva de productos e integración Kardex
    │   ├── useProductFilters.ts             # Filtros por categoría, stock bajo y búsqueda
    │   ├── useProductForm.ts                # Validación, imageUrl y cálculo de márgenes ($ y %)
    │   └── useCategories.ts                 # Carga de categorías activas
    └── components/
        ├── ProductTable.tsx                 # Contenedor principal de la tabla densa
        ├── ProductToolbar.tsx               # Barra de acciones [ALT+N], [ALT+E], Excel, Demos
        ├── ProductFilters.tsx               # Chips de estado y categorías
        ├── ProductRows.tsx                  # Filas con miniatura 32x32 e icono fallback
        ├── ProductStatusBar.tsx             # Resumen inferior de SKU totales y valor inventario
        ├── AddProductModal.tsx              # Modal de nuevo/editar producto
        ├── ProductBasicFields.tsx           # Subcomponente campos básicos y selector de imagen
        ├── ProductPricingFields.tsx         # Subcomponente precios y márgenes
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

| Atajo | Acción |
| :---: | :--- |
| `[F2]` | Cambiar a pestaña **Inventario & Productos** |
| `[ALT + N]` | Abrir modal para **Nuevo Producto** |
| `[ALT + E]` | Abrir modal de **Entradas Masivas** de stock |
| `[ALT + S]` | Abrir modal de **Salidas Masivas / Mermas** |
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
   *(Ejemplo: Costo $100.00 con 10% de ganancia = $10.00 de ganancia y $110.00 de precio de venta final).* También permite ajuste manual bidireccional si se requiere redondear centavos.
3. **División de Componentes:** Todos los modales y formularios deben seguir subdivididos en archivos independientes para garantizar que ninguno supere **300 líneas de código** y los hooks **200 líneas**.
4. **Formato CSV con BOM:** Al exportar a Excel, el archivo debe comenzar con el byte order mark `\uFEFF` para asegurar compatibilidad total con Excel en Windows.
5. **Persistencia de Imágenes:** El campo `image_url` almacena cadenas base64 (`data:image/...`) para archivos subidos localmente o URLs HTTP/HTTPS seguras para productos de catálogo web o demostración.
