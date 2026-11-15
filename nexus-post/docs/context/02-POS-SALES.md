# 🛒 MÓDULO 02 — PUNTO DE VENTA (POS) Y VENTAS

> **Contexto Modular:** Este documento contiene la arquitectura, flujos transaccionales, atajos de teclado y reglas de desarrollo del Terminal de Ventas (POS) de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo POS es el núcleo transaccional de atención rápida:
- Búsqueda reactiva de productos por código de barras (lector USB/Bluetooth) o descripción en vivo (`[ALT + L]`).
- Carrito de compras con steppers de cantidad (`+`/`-`), cálculo de descuentos en línea y validación inmediata de existencias (prevención de sobreventa).
- Panel de cobro inferior con desglose de subtotal, descuentos, IVA 16% y visor total en `#0078D4`.
- Modal de Cobro Estándar (`[F12]`): Métodos de pago en Efectivo, Tarjeta, Mixto y Crédito.
- Cobro Rápido en Efectivo (`[ALT + Q]`): Liquidación inmediata con un solo toque.
- Pago Dividido / Mixto (`[F11]`): Distribución exacta de montos entre múltiples formas de pago.
- Suspensión y reanudación de ventas en espera (`[ALT + P]`).
- Generación y previsualización de ticket térmico de 80mm en estándar ESC/POS (`[ALT + V]`).

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/sales/                        # Entidades Sale, SaleItem, PaymentMethod
│   ├── ports/sales.repository.ts            # Puerto persistencia de ventas
│   ├── adapters/persistence/sqlite/
│   │   ├── sales.sqlite.ts                  # Transacción atómica SQLite (Venta + Kardex + Stock)
│   │   └── migrations/002_sales.ts          # Tablas 'sales' y 'sale_items'
│   └── ipc/sales.ipc.ts                     # Handlers IPC de ventas
│
├── shared/contracts/
│   └── sales.contract.ts                    # DTOs: CreateSaleInput, SaleResult, CartItem
│
└── renderer/src/features/pos/
    ├── POSView.tsx                          # Pantalla principal del terminal de ventas
    ├── components/
    │   ├── SaleModal.tsx                    # Modal de cobro estándar [F12]
    │   ├── SplitPaymentModal.tsx            # Modal de pago dividido [F11]
    │   ├── SuspendedSalesModal.tsx          # Modal de ventas en espera [ALT + P]
    │   └── TicketPreviewModal.tsx           # Modal de previsualización de ticket 80mm
    └── types/
        ├── POSView.type.ts                  # Tipos locales del carrito y estado
        └── index.ts                         # Re-export de tipos
```

---

## 3. Atajos de Teclado del POS

| Atajo | Acción | Descripción |
| :---: | :--- | :--- |
| `[F1]` | Foco en Terminal POS | Activa la pestaña y enfoca el input de escáner |
| `[F12]` | Cobro Estándar | Despliega el modal de pago completo |
| `[ALT + Q]` | Cobro Rápido | Cierra la venta asumiendo pago exacto en efectivo |
| `[ALT + L]` | Selector en Lista | Modal o dropdown para buscar productos por nombre |
| `[ALT + P]` | Suspender Venta | Guarda la venta actual en cola y libera el carrito |
| `[ALT + V]` | Previsualizar Ticket | Muestra el ticket térmico de 80mm formateado |
| `[Esc]` | Cancelar / Limpiar | Limpia el carrito o cierra el modal activo |
| `[Enter]` | Agregar por Código | Al escanear con la pistola o presionar Enter |

---

## 4. Conexiones con Otros Módulos

- ➡️ **Módulo 03 (Inventario):** Consulta existencias en tiempo real y descuenta el stock de forma atómica en SQLite.
- ➡️ **Módulo 04 (Kardex):** Cada venta confirmada genera automáticamente un registro inmutable de Kardex con tipo `SALIDA (-)` y motivo `VENTA`.
- ➡️ **Módulo 05 (Caja y Turno):** El dinero recibido (efectivo) incrementa directamente la gaveta de caja del turno abierto.
- ➡️ **Módulo 06 (Clientes):** Si la venta se marca como método `CRÉDITO`, el total se carga a la deuda del cliente seleccionado.
- ➡️ **Módulo 08 (Hardware):** Al finalizar la venta, envía el comando de impresión a la impresora térmica USB/COM y pulso de apertura a la gaveta de dinero.

---

## 5. Reglas de Negocio Específicas

1. **Transaccionalidad Atómica:** El registro de la venta, el decremento de existencias en `products` y la inserción en `kardex` deben ocurrir dentro de una misma transacción SQLite (`db.transaction()`).
2. **Validación de Sobrevendido:** Si un producto no tiene suficiente stock y el cajero carece del permiso `CAN_OVERRIDE_NO_STOCK`, la interfaz bloquea el cobro y resalta la fila en `#C42B1C`.
3. **Restricción de Tamaño:** `POSView.tsx` no debe rebasar **300 líneas**. Extraer componentes como `CartTable`, `TotalsPanel` y `SearchBar` si el archivo se expande.
