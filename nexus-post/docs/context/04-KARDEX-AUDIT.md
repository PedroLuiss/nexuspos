# 📜 MÓDULO 04 — KARDEX Y AUDITORÍA INMUTABLE

> **Contexto Modular:** Este documento contiene la arquitectura, modelo de datos y reglas de auditoría inmutable de inventarios de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Kardex constituye el libro mayor inmutable de movimientos físicos y contables de stock:
- **Trazabilidad Completa:** Cada incremento o decremento de stock queda grabado permanentemente con fecha/hora exacta, usuario responsable, stock previo, cantidad movida y stock resultante.
- **Tipos de Movimiento:**
  - `ENTRADA (+)`: Compras a proveedores, inventario inicial, recepciones entre sucursales, devoluciones de clientes.
  - `SALIDA (-)`: Ventas en caja, mermas, roturas, productos caducados, envíos a otras sucursales.
- **Filtrado Avanzado:** Búsqueda reactiva por nombre de producto, SKU o usuario responsable; filtros por tipo (`ENTRADA`/`SALIDA`) y motivo específico.
- **Exportación Contable:** Capacidad de exportar la sábana de auditoría a hojas de cálculo (`.xlsx`).

---

## 2. Persistencia e integración actual

Los movimientos se guardan en la tabla SQLite `stock_movements`. `InventoryService.adjustStock()` actualiza el stock y agrega el movimiento en una misma transacción; `InventoryService.listMovements()` consulta el historial. Ambos flujos están disponibles mediante los canales IPC `inventory:adjustStock` e `inventory:listMovements`, expuestos en `window.api.inventory`.

La vista Kardex obtiene el historial persistido al abrir el módulo y permite volver a cargarlo. Los errores de lectura se muestran en pantalla; el listado vacío ya no se sustituye por registros de demostración. Las salidas originadas por el POS no se persisten todavía: los productos y las ventas de ese flujo siguen siendo datos de demostración, así que no deben presentarse como movimientos contables reales.

## 3. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/inventory/                    # KardexMovement entity, reglas de auditoría
│   ├── ports/inventory.repository.ts        # Puerto de persistencia de movimientos
│   ├── adapters/persistence/sqlite/
│   │   ├── stock-movements.sqlite.ts         # Persistencia y consulta de movimientos
│   │   └── migrations/002_stock_movements.ts # Tabla 'stock_movements'
│   └── ipc/inventory.ipc.ts                 # Handler 'inventory:list-movements'
│
├── shared/contracts/
│   └── inventory.contract.ts                # Interfaces KardexMovement, KardexReason, etc.
│
└── renderer/src/features/kardex/
    ├── api/kardex.api.ts                    # Lectura a través del puente IPC
    ├── hooks/useKardex.ts                   # Carga, actualización y errores
    └── KardexView.tsx                       # Vista con tabla densa y KPI summary
```

## 4. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F3]` | Cambiar a pestaña **Kardex (Auditoría Inmutable)** |
| `[F4]` | (En Stitch alternativo) Acceso a trazabilidad inmutable |

---

## 5. Reglas Críticas de Integridad

1. **Inmutabilidad Absoluta (Append-Only):** La tabla de movimientos de Kardex **NUNCA** permite operaciones de `UPDATE` ni `DELETE`. Todo registro es un hecho histórico inalterable. Si hubo un error en un movimiento, se compensa con un nuevo registro de sentido inverso y motivo de ajuste.
2. **Registro Obligatorio en Cada Transacción:** Ningún módulo puede alterar el campo `stock` de `products` sin registrar el evento correspondiente en `inventory_movements`.
3. **Mantenimiento del Límite de Líneas:** Si `KardexView.tsx` supera las **300 líneas** al añadir exportación Excel o filtros de fechas, se debe dividir en `KardexTable.tsx` y `KardexToolbar.tsx`.
