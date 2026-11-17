# 💵 MÓDULO 05 — CAJA, TURNOS Y ARQUEO

> **Contexto modular:** turnos por cajero, movimientos físicos de efectivo, conciliación y devoluciones.
> Para estándares globales, consulta [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md).

## Persistencia y contratos

- `cash_shifts` representa un turno y pertenece a un usuario. Un índice único parcial permite como máximo un turno abierto por cajero.
- `cash_movements` es el libro de movimientos de efectivo. `cash_effect` tiene signo y define el impacto en la gaveta.
- `sale_refunds` registra devoluciones completas y evita duplicar la devolución de una factura.
- La migración 013 agrega las tablas y relaciones con ventas, artículos vendidos, abonos y clientes; la 014 asegura que las ventas en efectivo puedan usar `SALE` como origen de movimiento.
- El contrato compartido está en `src/shared/contracts/cash.contract.ts`; persistencia y reglas están en `src/main/adapters/persistence/sqlite/cash.sqlite.ts` y `src/main/domain/cash/cash.service.ts`.
- IPC disponible en `cash:getRegister`, `cash:openShift`, `cash:closeShift`, `cash:addMovement` y `cash:returnSale`.
- La base recibe ventas en efectivo con origen `SALE`; la migración 014 actualiza el `CHECK` de `cash_movements.source` para bases existentes sin perder movimientos anteriores.

## Reglas operativas

- Abrir turno requiere sesión de cajero o administrador y un fondo inicial no negativo.
- Cobrar, pausar ventas y registrar abonos requiere un turno abierto asociado al usuario autenticado.
- Los ingresos de ventas en efectivo (incluida la parte en efectivo del pago mixto), abonos, ingresos manuales, egresos y reintegros en efectivo actualizan el mismo libro.
- Los gastos manuales requieren permiso `CAN_MANUAL_CASH_MOVEMENTS`, concepto y efectivo disponible suficiente.
- Arqueo: `efectivo esperado = fondo inicial + suma(cash_effect)`. El cierre persiste el efectivo contado y la diferencia.
- El modal de cierre muestra el esperado de gaveta, el desglose de fondo inicial, efectivo de ventas, abonos, ingresos manuales, gastos y devoluciones en efectivo, además del número de tickets. Instruye excluir tarjeta/crédito del conteo y calcula sobrante/faltante en vivo al escribir el total contado; antes de ingresar el monto no muestra una diferencia engañosa.
- El historial administrativo de cajas cerradas solo se muestra a usuarios `ADMIN`. La tabla incluye turnos de todos los cajeros y resume cajero, apertura/cierre, fondo inicial, efectivo esperado, monto contado y diferencia; `Ver caja` abre el detalle completo (balance, pagos, movimientos y facturas). La autorización también se valida en `CashService`: los usuarios no administradores reciben únicamente sus propios turnos y no pueden consultar por IPC el turno de otro cajero.
- En el renderer, la lista administrativa se implementa en `CashShiftHistoryPanel.tsx`; la selección de una caja conserva los límites de operación: el historial es de consulta y apertura, cierre, movimientos o devoluciones solo afectan la caja abierta del usuario autenticado.
- La tabla de facturas permite filtrar por coincidencia parcial del código/número de factura y paginar los resultados en bloques de 10. El filtro y la paginación operan sobre las facturas del turno seleccionado; la carga de datos y los totales siguen usando el registro persistido completo del turno.
- Solo se puede devolver una factura completa, desde el turno abierto que la generó y con reintegro según el método original. El backend comprueba que haya efectivo suficiente para el componente del reintegro en efectivo y rechaza duplicados.
- La devolución restaura existencias y crea un movimiento de entrada en Kardex. Si era una venta a crédito, se cancela la deuda pendiente y los abonos ya recibidos pasan al saldo a favor del cliente.
- Ventas creadas antes de la migración no tienen `cash_shift_id`; no se asignan retrospectivamente a un cajero.

## Archivos principales

```text
src/
├── main/domain/cash/cash.service.ts
├── main/ports/cash.repository.ts
├── main/adapters/persistence/sqlite/cash.sqlite.ts
├── main/adapters/persistence/sqlite/migrations/013_cash_register.ts
├── main/adapters/persistence/sqlite/migrations/014_cash_sale_movement_source.ts
├── main/ipc/cash.ipc.ts
├── preload/index.ts
├── shared/contracts/cash.contract.ts
└── renderer/src/features/cash-shift/
    ├── CashShiftView.tsx
    ├── api/cash.api.ts
    └── components/
        ├── CashTicketsPanel.tsx
        ├── CashShiftHistoryPanel.tsx
        ├── CashCloseSummary.tsx
        ├── CashShiftDialog.tsx
        └── CashTicketsPagination.tsx
```

`CashShiftView.tsx` coordina la vista y delega apertura, cierre y movimientos en `CashShiftDialog.tsx`, que contiene el arqueo de cierre y su desglose en `CashCloseSummary.tsx`. El selector de historial y la consulta de facturas también están separados en componentes para mantener el límite de 300 líneas.
