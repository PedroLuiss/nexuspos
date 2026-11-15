# 💵 MÓDULO 05 — CAJA, TURNOS Y CORTE CONTABLE (ARQUEO Z)

> **Contexto Modular:** Este documento contiene la arquitectura, fórmulas de balance contable y reglas de operación de caja chica y turnos de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Caja supervisa el flujo de dinero físico en la gaveta y la conciliación al finalizar el turno:
- **Apertura de Turno:** Registro del fondo inicial de caja (cambio base en monedas/billetes).
- **Control de Movimientos Manuales (`[ALT + D]` / `[ALT + G]`):**
  - **Ingresos Extraordinarios:** Aportes de cambio o transferencias de caja fuerte.
  - **Egresos / Gastos Menores:** Pagos a proveedores, compra de suministros o retiros autorizados con motivo justificado.
- **Ecuación de Dinero en Gaveta:**
  $$\text{Total Físico Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} + \text{Abonos Clientes} + \text{Ingresos Extras} - \text{Egresos}$$
- **Cierre de Turno y Arqueo Z (`[ALT + K]`):**
  - Captura del dinero físico contado por el cajero.
  - Conciliación matemática con detección automática de:
    - **Cuadre Perfecto** (diferencia = \$0.00 en verde).
    - **Sobrante de Caja** (diferencia > \$0.00 en azul).
    - **Faltante de Caja** (diferencia < \$0.00 en rojo).
  - Emisión de comprobante Z en papel térmico de 80mm.

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/cash/                         # ShiftState, CashMovement, reglas de conciliación
│   ├── ports/cash.repository.ts             # Puerto para turnos y movimientos de caja
│   ├── adapters/persistence/sqlite/
│   │   ├── shifts.sqlite.ts                 # Tablas 'shifts' y 'cash_movements'
│   │   └── migrations/                      # Migración de caja
│   └── ipc/cash.ipc.ts                      # Handlers 'cash:*'
│
├── shared/contracts/
│   └── cash.contract.ts                     # Interfaces ShiftState, CashMovement, CloseShiftInput
│
└── renderer/src/features/cash-shift/
    ├── CashShiftView.tsx                    # Vista principal de corte de turno y balances
    └── components/ (Pendiente de modularización):
        ├── CashSummaryCards.tsx             # Métricas de ventas brutas/netas
        ├── CashEquationPanel.tsx            # Desglose de la ecuación en gaveta
        ├── CashMovementModal.tsx            # Modal de gastos/ingresos manuales
        └── CloseShiftModal.tsx              # Modal de Arqueo Z
```

---

## 3. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F4]` | Cambiar a pestaña **Caja & Corte de Turno** |
| `[ALT + G]` | Registrar **Gasto Manual** en caja |
| `[ALT + D]` | Modal de **Movimientos de Caja Chica** (CashInOutModal) |
| `[ALT + K]` | Modal de **Apertura y Cierre de Turno** (CashShiftModal) |

---

## 4. Conexiones con Otros Módulos

- ➡️ **Módulo 01 (Auth):** El turno siempre está ligado al operador autenticado (`shift.cashierId`).
- ➡️ **Módulo 02 (POS):** Cada cobro en efectivo suma automáticamente a `shift.totalCashSales`.
- ➡️ **Módulo 06 (Clientes):** Los abonos en efectivo a cuentas por cobrar ingresan en tiempo real como dinero físico en gaveta (`shift.abonos`).
- ➡️ **Módulo 08 (Hardware):** Al abrir o cerrar turno o registrar gastos, emite comando para disparar el solenoide de la gaveta de dinero.

---

## 5. Tareas Pendientes / Deuda Técnica

- ⚠️ **Refactorización de Líneas:** `CashShiftView.tsx` actualmente supera las 600 líneas. Debe subdividirse en los 4 componentes listados en el mapa de archivos para apegarse a la regla estricta de $\le 300$ líneas por componente.
