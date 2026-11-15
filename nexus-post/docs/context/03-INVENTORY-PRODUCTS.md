# 📦 MÓDULO 03 — INVENTARIO Y CATÁLOGO DE PRODUCTOS

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, diseño de base de datos y reglas de desarrollo del catálogo comercial y control de existencias de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Inventario y Productos gestiona el catálogo comercial y las existencias físicas:
- **Tabla Densa Estilo Excel (`ProductTable.tsx`):** Columnas con SKU, descripción, costo, precio de venta, categoría, stock actual, mínimo de alerta y badge de estado. Filas densas de 40px con resaltado hover y alertas visuales.
- **CRUD Completo de Productos:** Creación en 2 columnas (`AddProductModal.tsx`), edición en caliente y activación/desactivación.
- **Soft Delete Obligatorio:** Borrado lógico (`deleted = 1`, `active = 0`) para preservar la trazabilidad histórica de Kardex y tickets pasados.
- **Entradas y Salidas Masivas de Stock (`StockAdjustmentModal.tsx` / `[ALT + E]` / `[ALT + S]`):** Recepción de mercancía por compras o bajas por merma/caducidad con motivo obligatorio.
- **Generador de Etiquetas de Código de Barras (`BarcodeGeneratorModal.tsx` / `[ALT + B]`):** Formatos EAN-13 y Code128, resolución DPI configurable (203, 300, 600 DPI), dimensiones en milímetros y número de copias por lote para impresoras Zebra o Xprinter.
- **Gestión de Categorías (`CategoryManagerModal.tsx`):** Administración de categorías comerciales asociadas a productos.
- **Consulta de Stock en Sucursales (`StockBranchModal.tsx` / `[ALT + O]`):** Consulta y transferencia de existencias entre sucursales de la empresa.

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
│   │   ├── products.sqlite.ts               # Queries SQLite (CRUD + Soft Delete)
│   │   ├── categories.sqlite.ts             # Queries SQLite para categorías
│   │   └── migrations/                      # 001_initial.ts, etc.
│   └── ipc/
│       ├── products.ipc.ts                  # Handlers 'products:*'
│       └── categories.ipc.ts                # Handlers 'categories:*'
│
├── shared/contracts/
│   └── products.contract.ts                 # Product, ProductInput, ProductFilter, AdjustStockInput
│
└── renderer/src/features/inventory/
    ├── api/
    │   ├── products.api.ts                  # Invocación IPC para productos
    │   └── categories.api.ts                # Invocación IPC para categorías
    ├── hooks/
    │   ├── useProducts.ts                   # Carga reactiva de productos
    │   ├── useProductFilters.ts             # Filtros por categoría, stock bajo y búsqueda
    │   ├── useProductForm.ts                # Validación y cálculo de márgenes ($ y %)
    │   └── useCategories.ts                 # Carga de categorías
    └── components/
        ├── ProductTable.tsx                 # Contenedor principal de la tabla densa
        ├── ProductToolbar.tsx               # Barra de búsqueda y botones [ALT+N], [ALT+E], etc.
        ├── ProductFilters.tsx               # Chips de estado y categorías
        ├── ProductRows.tsx                  # Filas renderizadas con badges
        ├── ProductStatusBar.tsx             # Resumen inferior de SKU totales y valor inventario
        ├── AddProductModal.tsx              # Modal de nuevo producto (2 columnas)
        ├── ProductBasicFields.tsx           # Subcomponente campos básicos
        ├── ProductPricingFields.tsx         # Subcomponente precios y márgenes
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
| `[ALT + O]` | Abrir modal de **Stock en Sucursales** |
| `[ALT + M]` | Abrir modal de **Ajuste de Stock Masivo** |

---

## 4. Reglas Críticas de Negocio

1. **Borrado Lógico Obligatorio:** NUNCA ejecutar `DELETE FROM products WHERE id = ?`. La eliminación se implementa como:
   ```sql
   UPDATE products SET deleted = 1, active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
   ```
2. **Cálculo de Márgenes Automático:** Al ingresar el costo y el precio de venta en el formulario, el sistema calcula en vivo:
   $$\text{Margen } \$ = \text{Precio Venta} - \text{Precio Compra}$$
   $$\text{Margen } \% = \left(\frac{\text{Precio Venta} - \text{Precio Compra}}{\text{Precio Venta}}\right) \times 100$$
3. **División de Componentes:** Todos los modales y formularios deben seguir subdivididos en archivos independientes para garantizar que ninguno supere **300 líneas de código**.
