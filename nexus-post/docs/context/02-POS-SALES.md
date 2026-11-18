# 🛒 MÓDULO 02 — PUNTO DE VENTA (POS) Y VENTAS

> **Contexto Modular:** Este documento contiene la arquitectura, flujos transaccionales, atajos de teclado y reglas de desarrollo del Terminal de Ventas (POS) de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo POS es el núcleo transaccional de atención rápida:

- Búsqueda reactiva SQLite por nombre, código o código de barras; el buscador trae páginas de 50 productos y permite cargar más. Un campo vacío oculta resultados; el botón Lista abre el primer lote.
- Carrito conectado al catálogo SQLite; descuentos requieren `CAN_APPLY_DISCOUNT` y `CAN_OVERRIDE_NO_STOCK` permite sobreventa solo si hay stock positivo.
- La cantidad depende de la unidad del producto: kilogramo y litro admiten decimales (hasta 3 posiciones); pieza, unidad, caja y paquete requieren enteros. Esta regla se valida en el POS y nuevamente al registrar la venta.
- Los importes se manejan en USD. Bajo el total se muestra la conversión informativa a bolívares con tasa oficial BCV.
- Modal de Cobro Estándar (`[F12]`): Métodos de pago en Efectivo, Tarjeta, Mixto y Crédito.
- Cobro Rápido en Efectivo (`[ALT + Q]`): Liquidación inmediata con un solo toque.
- Pago mixto (`[F8]`): Distribución exacta entre efectivo y tarjeta.
- Suspensión y reanudación de ventas en espera persistidas en SQLite (`[ALT + P]`).
- Previsualización del ticket de 80mm. La impresión física ESC/POS aún no está conectada.

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/sales/sales.service.ts         # Validación y transacción de ventas
│   ├── domain/exchange-rate/                 # Consulta y fallback de tasa BCV
│   ├── ports/sales.repository.ts             # Puerto de persistencia de ventas
│   ├── adapters/persistence/sqlite/
│   │   ├── sales.sqlite.ts                   # Ventas y ventas en espera
│   │   ├── exchange-rates.sqlite.ts          # Caché de tasa
│   │   └── migrations/012_sales_exchange_rates.ts # Ventas, pausas y tasa
│   ├── adapters/remote/bcv-exchange-rate.adapter.ts
│   └── ipc/{sales,exchange-rate}.ipc.ts       # Handlers IPC
│
├── shared/contracts/
│   ├── sales.contract.ts                    # DTOs de venta y venta en espera
│   └── exchange-rate.contract.ts             # DTO de tasa USD/VES
│
└── renderer/src/
    ├── shared/hooks/useBusinessConfig.ts    # Configuración tributaria
    └── features/pos/
        ├── POSView.tsx                      # Búsqueda, carrito, clientes y cobro
        ├── api/sales.api.ts                 # Puente tipado a window.api
        ├── hooks/useUsdVesRate.ts           # Consulta y refresco de tasa
        ├── components/
        │   ├── SaleModal.tsx                # Efectivo, tarjeta y crédito
        │   ├── SplitPaymentModal.tsx        # Pago mixto
        │   ├── SuspendedSalesModal.tsx      # Ventas en espera
        │   └── TicketPreviewModal.tsx       # Previsualización del ticket
        └── types/POSView.type.ts
```

Las llamadas de persistencia se exponen como `window.api.sales` y
`window.api.exchangeRate`; el renderer no accede directamente a SQLite.

---

## 3. Atajos de Teclado del POS

|    Atajo    | Acción               | Descripción                                         |
| :---------: | :------------------- | :-------------------------------------------------- |
|   `[F2]`    | Buscar producto      | Enfoca el campo de búsqueda/lector                  |
|   `[F12]`   | Cobro Estándar       | Despliega el modal de pago completo                 |
|   `[F6]`    | Cobro en efectivo    | Abre cobro con efectivo preseleccionado             |
|   `[F7]`    | Cobro con tarjeta    | Abre cobro con tarjeta preseleccionada              |
|   `[F8]`    | Pago mixto           | Abre el modal para combinar efectivo y tarjeta      |
| `[ALT + Q]` | Cobro Rápido         | Cierra la venta asumiendo pago exacto en efectivo   |
| `[ALT + K]` | Asociar cliente      | Enfoca la búsqueda de cliente                       |
| `[ALT + L]` | Buscar en lista      | Enfoca/abre los resultados de productos             |
| `[ALT + P]` | Suspender Venta      | Guarda la venta actual en cola y libera el carrito  |
| `[ALT + E]` | Ventas en espera     | Abre la lista de ventas pausadas                    |
| `[ALT + T]` | Previsualizar Ticket | Muestra la previsualización del ticket              |
|   `[Esc]`   | Cancelar / Limpiar   | Limpia el carrito o cierra el modal activo          |
|  `[Enter]`  | Agregar por código   | Agrega la coincidencia exacta del lector o búsqueda |

---

## 4. Conexiones con Otros Módulos

- ➡️ **Módulo 03 (Inventario):** POS consulta el catálogo bajo demanda en páginas SQLite de 50 resultados; no carga el catálogo completo en memoria. La venta descuenta existencias de forma atómica.
- La búsqueda del catálogo solo consulta SQLite cuando hay texto o se abre explícitamente la Lista; trabaja mientras POS está activo y vuelve a consultar al regresar al módulo.
- ➡️ **Módulo 04 (Kardex):** Cada venta genera un movimiento `SALIDA`/`VENTA` dentro de la misma transacción de venta y stock.
- ➡️ **Módulo 05 (Caja y Turno):** El cobro y la pausa de ventas requieren que el usuario tenga un turno abierto. Cada venta se asocia a ese turno y su componente en efectivo se registra como movimiento; los detalles están en [`05-CASH-SHIFT.md`](./05-CASH-SHIFT.md).
- ➡️ **Módulo 06 (Clientes):** El cliente asociado queda guardado en la venta. El pago a crédito registra la deuda y valida el límite dentro del flujo transaccional.
- ➡️ **Módulo 08 (Ajustes y Hardware):** La configuración tributaria se lee de `business_settings`. La impresión térmica y el pulso de gaveta todavía no están integrados; la previsualización no equivale a imprimir.

### Persistencia, moneda y pagos

- La migración `012_sales_exchange_rates` crea `sales`, `sale_items`, `suspended_sales` y `exchange_rates`. La venta guarda un snapshot de la tasa disponible.
- `SalesService` recalcula precios e impuestos con los datos persistidos, valida el medio de pago y ejecuta venta, decremento de stock, Kardex y deuda de crédito en una transacción SQLite.
- Carrito, ticket y ventas en espera muestran cantidad junto con su unidad; las cantidades fraccionarias se conservan en venta, stock y Kardex.
- Las ventas pausadas se serializan en SQLite y pueden restaurarse o eliminarse desde el modal. Restaurar requiere un carrito activo vacío.
- Los cuatro medios registrados son efectivo, tarjeta, mixto y crédito. Los montos de cobro se expresan exclusivamente en USD; la conversión VES es informativa.
- La venta persiste el cliente y el turno asociados, guarda el costo histórico por artículo y sincroniza venta, stock, Kardex, crédito y movimiento de efectivo dentro de la transacción.
- Las ventas en espera se guardan por cajero y requieren caja abierta para listar, pausar o recuperar. Reanudar requiere carrito vacío; los registros históricos sin cajero asignado no se exponen como ventas de espera del usuario.
- La tasa USD/VES se consulta desde `https://ve.dolarapi.com/v1/dolares/oficial`, se refresca al iniciar el POS y cada 30 minutos, y se almacena localmente. Si el proveedor falla, se usa la última tasa cacheada con indicador de desactualización; sin caché se informa el error sin bloquear ventas USD.
- El pago con tarjeta se confirma manualmente por el cajero; no existe conexión con pinpad o procesador de pagos. La opción de impresión automática del modal de cobro aún no está conectada.
- La consulta y devolución de tickets se realiza desde el contexto de Caja. La devolución disponible es total, no parcial, y está restringida al turno abierto que generó la factura.

---

## 5. Reglas de Negocio Específicas

1. **Transaccionalidad Atómica:** El registro de la venta, el decremento de existencias en `products` y la inserción en `kardex` deben ocurrir dentro de una misma transacción SQLite (`db.transaction()`).
2. **Validación de Existencias:** Un producto con control de stock y existencia igual o menor a cero no se puede agregar ni facturar, incluso con `CAN_OVERRIDE_NO_STOCK`. Ese permiso solo permite sobreventa cuando todavía existe stock positivo; el POS y `SalesService` validan el límite, y el Kardex conserva el saldo resultante. Los servicios (`trackStock = false`) no están sujetos a esta regla.
3. **Descuentos:** El permiso `CAN_APPLY_DISCOUNT` se valida tanto en la interfaz como en el servicio de ventas.
4. **Restricción de Tamaño:** `POSView.tsx` no debe rebasar **300 líneas**. Extraer componentes como `CartTable`, `TotalsPanel` y `SearchBar` si el archivo se expande.
5. **Impuesto multi-tasa:** cada producto aporta su propia alícuota (`product.taxRate`/`taxName` resueltos del catálogo `taxes`). El POS calcula subtotal, descuento y **desglose por tasa** con `computeSaleTotals` de `@shared/lib/tax` (misma función que usa el backend al cobrar). Si `taxEnabled` es `false`, no se traslada impuesto y la línea desaparece del resumen y del ticket. Con `pricesIncludeTax` activo el impuesto se desagrega del precio y el total no cambia; los productos exentos alimentan la **base exenta**.
6. **Precio con impuesto incluido:** Si `pricesIncludeTax === true`, `computeTaxAmount` desagrega el impuesto del precio y `computeGrandTotal` **no** lo suma; el cliente paga el precio de lista. En caso contrario, el impuesto se suma al subtotal.
7. **Consistencia del cobro:** `SalesService` vuelve a calcular importes usando productos y configuración persistidos en main; los totales enviados desde renderer deben coincidir con esa comprobación.
8. **Precios por mayoreo (tiers):** el precio unitario de una línea depende de la cantidad del carrito. `computeSaleTotals` recibe `priceTiers` por línea y aplica `resolveUnitPrice` (`@shared/lib/product-pricing`): entre las escalas aplicables gana la de mayor `minQuantity`, y si ninguna aplica se usa `salePrice`. El POS carga todas las escalas con `useAllPriceTiers` y resalta en la fila del carrito cuando se aplicó un precio de mayoreo. El backend vuelve a resolver las escalas desde SQLite antes de persistir, garantizando que importes cobrados y mostrados sean idénticos.
9. **Búsqueda por códigos de barras múltiples:** el buscador del POS reconoce tanto `product.code` como cualquiera de los códigos de `product_barcodes` (migración 017); al escanear, se agrega el producto coincidente al carrito.
10. **Combos / bundles:** un producto tipo `combo` se cobra a su precio de venta (con tiers si aplica), pero su stock disponible se deriva de sus componentes (`MIN(stock/cantidad_por_combo)` en `products.sqlite.ts`). Esa cifra es la que valida el POS para sobreventa y la que valida `SalesService` al cobrar; al confirmar, se descuenta cada componente y se registran movimientos Kardex `COMBO` (ver contexto 04).
11. **Servicios vendibles (auditoría):** los tipos con `trackStock = false` (Servicio) se pueden agregar y cobrar aunque tengan stock 0: `App.tsx`, `POSView` (déficit de stock) y `SalesService` omiten la validación y el descuento de existencias, y no generan Kardex. Esto permite al POS atender negocios de servicios (peluquería, talleres, consultoría), no solo venta de artículos físicos.
12. **Carrito coherente con el cobro:** el campo `total` de cada línea del carrito se recalcula con `resolveUnitPrice` (escalas de mayoreo) al agregar, cambiar cantidad o aplicar descuento, de modo que coincida con lo que `computeSaleTotals` y el backend calculan.
13. **Devoluciones con trazabilidad:** cada línea de venta persiste `is_combo`, `combo_id` y `batches_json` (migración 022). Al devolver un ticket, `CashService` repone los componentes del combo y los lotes exactos descontados (ver contexto 05), en lugar de sumar stock al producto equivocado.
14. **Buscador paginado:** POS usa `products:listPage` con `pageSize: 50`, filtros de nombre/código/categoría/códigos de barras secundarios y `onlyActive`; la búsqueda se retrasa 250 ms mientras se escribe. El código exacto se prioriza y las ventas exitosas actualizan los resultados abiertos. El listado explícito también se carga de 50 en 50 y presenta skeletons durante la carga.
