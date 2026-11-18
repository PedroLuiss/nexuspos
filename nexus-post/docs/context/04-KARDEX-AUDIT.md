# 📜 MÓDULO 04 — KARDEX Y AUDITORÍA INMUTABLE

> **Contexto Modular:** Este documento contiene la arquitectura, modelo de datos y reglas de auditoría inmutable de inventarios de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Kardex constituye el libro mayor inmutable de movimientos físicos y contables de stock:
- **Trazabilidad Completa:** Cada incremento o decremento de stock queda grabado permanentemente con fecha/hora exacta, usuario responsable, stock previo, cantidad movida y stock resultante.
- **Tipos de Movimiento:**
  - `ENTRADA (+)`: Actualmente soporta `ENTRADA_MASIVA`, `INVENTARIO_INICIAL` y `DEVOLUCION`.
  - `SALIDA (-)`: Actualmente soporta `VENTA`, `COMBO`, `SALIDA_AJUSTE` y `MERMA`. El motivo `COMBO` se genera al cobrar un producto tipo bundle: se descuenta cada componente del combo (no el combo directamente) y se registra una salida por componente con las cantidades consumidas.
  - **Lotes (FEFO):** cuando un producto controla lotes (`track_batches`), cada salida (`VENTA`, `COMBO` o ajuste) se desglosa en un movimiento por lote consumido, con el nº de lote en las notas. Las salidas descuentan primero el lote que vence antes (First Expired, First Out); los lotes sin vencimiento salen al final.
- **Filtrado Avanzado:** Búsqueda reactiva por nombre de producto, SKU o usuario responsable; filtros por tipo (`ENTRADA`/`SALIDA`) y motivo específico.
- **Exportación Contable:** El botón de exportación está presente como placeholder visual; la generación real de `.xlsx`/`.csv` sigue pendiente.

---

## 2. Persistencia e integración actual

Los movimientos se guardan en la tabla SQLite `stock_movements`. `InventoryService.adjustStock()` actualiza el stock y agrega el movimiento en una misma transacción; `InventoryService.listMovements()` consulta el historial. Ambos flujos están disponibles mediante los canales IPC `inventory:adjustStock` e `inventory:listMovements`, expuestos en `window.api.inventory`.

La vista Kardex obtiene el historial persistido al abrir el módulo y permite volver a cargarlo. Los errores de lectura se muestran en pantalla; un listado vacío no se sustituye por registros de demostración.

La operación de ventas también registra movimientos reales: `SalesService` descuenta existencias e inserta la salida `VENTA` en la transacción del cobro. Para productos tipo combo (`product_types.kind = 'combo'`), el cobro genera salidas `COMBO` por cada componente consumido (`cantidad_combo × cantidad_componente`) en lugar de descontar el combo directamente; el stock disponible del combo se deriva de sus componentes en `products.sqlite.ts`. `CashService.returnSale()` repone existencias e inserta una entrada `DEVOLUCION` en la misma transacción de devolución. Por lo tanto, el Kardex refleja ajustes manuales, cobros, combos y devoluciones vinculados a operaciones persistidas.

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
2. **Registro Obligatorio en Cada Transacción:** Ningún módulo puede alterar el campo `stock` de `products` sin registrar el evento correspondiente en `stock_movements`.
3. **Mantenimiento del Límite de Líneas:** Si `KardexView.tsx` supera las **300 líneas** al añadir exportación Excel o filtros de fechas, se debe dividir en `KardexTable.tsx` y `KardexToolbar.tsx`.

## 6. Límites y dependencias

- La fuente persistida es `stock_movements`; los nombres y códigos de producto se guardan como snapshot del movimiento para mantener trazabilidad.
- Un error de movimiento se corrige con otro movimiento compensatorio; no se reescribe el historial.
- La devolución completa crea entradas por cada artículo del ticket y se restringe a facturas del turno abierto que las generó. No hay devolución parcial.
- Esta integración no implica que exista exportación `.xlsx`: cualquier exportación debe verificarse por separado antes de documentarla como operativa.
- El botón actual muestra un mensaje de exportación, pero no genera ni descarga un archivo.
