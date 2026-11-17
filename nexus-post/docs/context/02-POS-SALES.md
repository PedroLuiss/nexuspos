# 🛒 MÓDULO 02 — PUNTO DE VENTA (POS) Y VENTAS

> **Contexto Modular:** Este documento contiene la arquitectura, flujos transaccionales, atajos de teclado y reglas de desarrollo del Terminal de Ventas (POS) de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo POS es el núcleo transaccional de atención rápida:

- Búsqueda reactiva de productos por nombre o código; lectores USB/Bluetooth tipo teclado agregan el código al presionar Enter.
- Carrito conectado al catálogo SQLite, descuentos sujetos al permiso `CAN_APPLY_DISCOUNT` y validación de stock conforme a `CAN_OVERRIDE_NO_STOCK`.
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

- ➡️ **Módulo 03 (Inventario):** El catálogo se carga desde SQLite. La venta descuenta existencias de forma atómica; `CAN_OVERRIDE_NO_STOCK` permite vender y registrar saldo negativo.
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
2. **Validación de Sobrevendido:** Si un producto no tiene suficiente stock y el usuario carece de `CAN_OVERRIDE_NO_STOCK`, la interfaz y backend bloquean el cobro. Con permiso, la existencia puede quedar negativa y el Kardex conserva el saldo resultante.
3. **Descuentos:** El permiso `CAN_APPLY_DISCOUNT` se valida tanto en la interfaz como en el servicio de ventas.
4. **Restricción de Tamaño:** `POSView.tsx` no debe rebasar **300 líneas**. Extraer componentes como `CartTable`, `TotalsPanel` y `SearchBar` si el archivo se expande.
5. **Impuesto dinámico:** La tasa y el nombre del impuesto provienen de `useBusinessConfig()` (Ajustes → IVA). Solo los productos con `hasTax === true` forman la base gravable. Si `taxEnabled` es `false`, no se traslada impuesto y la línea desaparece del resumen y del ticket.
6. **Precio con impuesto incluido:** Si `pricesIncludeTax === true`, `computeTaxAmount` desagrega el impuesto del precio y `computeGrandTotal` **no** lo suma; el cliente paga el precio de lista. En caso contrario, el impuesto se suma al subtotal.
7. **Consistencia del cobro:** `SalesService` vuelve a calcular importes usando productos y configuración persistidos en main; los totales enviados desde renderer deben coincidir con esa comprobación.
