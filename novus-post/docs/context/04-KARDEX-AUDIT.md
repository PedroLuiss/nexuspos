# 📜 MÓDULO 04 — KARDEX Y AUDITORÍA INMUTABLE

> **Contexto Modular:** Este documento contiene la arquitectura, modelo de datos y reglas de auditoría inmutable de inventarios de NovusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Kardex constituye el libro mayor inmutable de movimientos físicos y contables de stock:

- **Trazabilidad Completa:** Cada incremento o decremento de stock queda grabado permanentemente con fecha/hora exacta, usuario responsable, stock previo, cantidad movida y stock resultante.
- **Tipos de Movimiento:**
  - `ENTRADA (+)`: soporta `ENTRADA_MASIVA`, `INVENTARIO_INICIAL` y `DEVOLUCION` (devolución de cliente).
  - `SALIDA (-)`: soporta `VENTA`, `COMBO`, `SALIDA_AJUSTE`, `MERMA` y `DEVOLUCION` (devolución a proveedor). El tipo de movimiento se envía explícitamente; no se infiere del motivo `DEVOLUCION`, que aplica a ambos sentidos. El motivo `COMBO` se genera al cobrar un producto tipo bundle: se descuenta cada componente del combo (no el combo directamente) y se registra una salida por componente con las cantidades consumidas.
  - **Lotes (FEFO):** cuando un producto controla lotes (`track_batches`), las ventas (`VENTA`/`COMBO`) se desglosan en un movimiento por lote consumido, con el nº de lote en las notas. Los ajustes manuales registran un movimiento agregado, aunque actualizan los lotes consumidos. En ambos flujos se descuenta primero el lote que vence antes (First Expired, First Out); los lotes sin vencimiento salen al final.
- **Consulta eficiente:** semana calendario (lunes-domingo), mes actual, año actual o historial completo; búsqueda y filtros de tipo/motivo ejecutados en SQLite con paginación.
- **Detalle empresarial:** unidad, origen, referencia de ticket, lote, responsable y valoración en la moneda capturada en cada movimiento. El Kardex no convierte ni reescribe valores históricos al cambiar la moneda del negocio; costos anteriores sin snapshot se muestran como no disponibles.
- **Exportación Contable:** Permite elegir Excel (`.xlsx`) o PDF. Ambos formatos incluyen todos los movimientos que coinciden con los filtros activos, no solo la página visible, y abren el diálogo nativo para elegir dónde guardar. Las cabeceras incluyen el nombre, datos fiscales, dirección y contacto persistidos en `business_settings`, además del logo del proyecto `resources/logobanner.png`; no se usan los datos demo del renderer.

---

## 2. Persistencia e integración actual

Los movimientos se guardan en `stock_movements`. La migración 025 agrega snapshots de origen, unidad, referencia, lote, costo unitario y base de valoración; las filas previas conservan `source = LEGACY` y los datos que no podían conocerse quedan nulos. Los movimientos siguen siendo append-only.

`inventory:listMovements` recibe rango, búsqueda, tipo, motivo y paginación (25/50/100; 50 por defecto). SQLite filtra, ordena y pagina; también calcula totales de entradas/salidas agrupados por unidad y productos distintos sobre todo el filtro, no solo sobre la página visible. Esto evita mezclar cantidades de kg, litros o piezas en un balance dimensionalmente inválido. El módulo inicia en el mes calendario actual; semana significa lunes a domingo y el límite superior de cada período es exclusivo. El historial completo se consulta solo al seleccionarlo expresamente. `inventory:exportMovements` usa esos mismos filtros y exporta todos los resultados en el formato seleccionado, sin limitarse a la página actual.

La operación de ventas también registra movimientos reales: `SalesService` descuenta existencias e inserta la salida `VENTA` en la transacción del cobro. Para productos tipo combo (`product_types.kind = 'combo'`), el cobro genera salidas `COMBO` por cada componente consumido (`cantidad_combo × cantidad_componente`) en lugar de descontar el combo directamente; el stock disponible del combo se deriva de sus componentes en `products.sqlite.ts`. Los productos servicio (`trackStock = false`) no generan movimientos Kardex porque no manejan existencias.

Los movimientos nuevos guardan unidad, moneda, origen (`INVENTORY`, `POS` o `CASH`) y referencia de ticket cuando aplica. Ajustes y lotes usan el costo de ficha del producto, marcado como referencial; ventas usan el costo capturado al cobrar. Las devoluciones simples reutilizan el costo de la línea original y las devoluciones de componentes de combo buscan el costo del movimiento de salida del ticket. Si la venta es anterior a estos snapshots, el combo usa el costo de ficha actual marcado como referencial. El total se calcula como cantidad × costo unitario en la moneda original del registro.

**Devoluciones correctas (auditoría de integración):** antes `CashService.returnSale()` reponía stock sobre el producto del `sale_item`, lo cual era incorrecto para combos (se reponía el combo, nunca descontado) y para lotes (no se reponía el lote exacto). Ahora cada línea de venta persiste `is_combo`, `combo_id` y `batches_json` (migración 022), y la devolución:

- para combos → repone cada **componente** (`cantidad_componente × cantidad_vendida`) con movimiento `COMBO` de entrada;
- para lotes → repone el **lote exacto** descontado (o crea un lote `DEVOLUCION-YYYY-MM-DD` si la venta es histórica sin trazabilidad), con un movimiento `DEVOLUCION` por lote;
- para productos simples → comportamiento original.

Por lo tanto, el Kardex refleja fielmente ajustes manuales, cobros, combos, lotes FEFO y devoluciones vinculados a operaciones persistidas.

## 3. Mapa de Archivos del Módulo

```text
novus-post/src/
├── main/
│   ├── domain/inventory/                    # KardexMovement entity, reglas de auditoría
│   ├── ports/stock-movement.repository.ts   # Puerto de persistencia de movimientos
│   ├── adapters/export/kardex-exporter.ts   # Exportación XLSX y PDF con diálogo de guardado
│   ├── adapters/persistence/sqlite/
│   │   ├── stock-movements.sqlite.ts         # Persistencia, filtros, agregados y paginación
│   │   └── migrations/025_kardex_metadata.ts # Snapshots de trazabilidad y valoración
│   └── ipc/inventory.ipc.ts                 # Handlers de ajuste, consulta y exportación
│
├── shared/contracts/
│   └── inventory.contract.ts                # Interfaces KardexMovement, KardexReason, etc.
│
└── renderer/src/features/kardex/
    ├── api/kardex.api.ts                    # Lectura a través del puente IPC
    ├── hooks/useKardex.ts                   # Período inicial, query y carga paginada
    ├── components/                           # Filtros, resumen, exportación y tabla/paginación
    └── KardexView.tsx                       # Composición de la vista
```

## 4. Atajos de Teclado del Módulo

| Atajo  | Acción                                                  |
| :----: | :------------------------------------------------------ |
| `[ALT+3]` | Cambiar a pestaña **Kardex (Auditoría Inmutable)** |

---

## 5. Reglas Críticas de Integridad

1. **Inmutabilidad Absoluta (Append-Only):** La tabla de movimientos de Kardex **NUNCA** permite operaciones de `UPDATE` ni `DELETE`. Todo registro es un hecho histórico inalterable. Si hubo un error en un movimiento, se compensa con un nuevo registro de sentido inverso y motivo de ajuste.
2. **Registro Obligatorio en Cada Transacción:** Ningún módulo puede alterar el campo `stock` de `products` sin registrar el evento correspondiente en `stock_movements`.
3. **Mantenimiento del Límite de Líneas:** Los controles de filtro, resumen y tabla/paginación permanecen en componentes separados para respetar el máximo de 300 líneas por componente.

## 6. Límites y dependencias

- La fuente persistida es `stock_movements`; los nombres y códigos de producto se guardan como snapshot del movimiento para mantener trazabilidad.
- Los movimientos antiguos no se enriquecen con datos actuales de producto para fingir snapshots históricos; unidad/lote/referencia/costo desconocidos se muestran como no registrados.
- Un error de movimiento se corrige con otro movimiento compensatorio; no se reescribe el historial.
- La devolución completa crea entradas por cada artículo del ticket y se restringe a facturas del turno abierto que las generó. No hay devolución parcial.
- La exportación `.xlsx` incluye una hoja de movimientos con filtros y una hoja resumen; el PDF presenta el mismo conjunto filtrado en A3 horizontal. Ambos usan el diálogo nativo de guardado y notifican errores de generación.
- El logo se lee desde `resources/logobanner.png` en desarrollo y desde `app.asar.unpacked/resources/logobanner.png` en la aplicación empaquetada. Si el activo no está disponible, la exportación falla explícitamente en vez de generar un documento sin cabecera de marca.
