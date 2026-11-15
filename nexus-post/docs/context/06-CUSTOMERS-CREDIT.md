# 👥 MÓDULO 06 — CLIENTES, CRÉDITOS Y COBRANZAS

> **Contexto Modular:** Este documento contiene la arquitectura, gestión de cartera de clientes, cuentas corrientes y abonos de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Clientes administra el directorio de compradores y la cartera de créditos comerciales:
- **Padrón de Clientes:** Identificación mediante código único (`CLI-xxx`), nombre/razón social, RFC/documento fiscal, teléfono, dirección y email.
- **Límites de Crédito:** Asignación de cupo máximo financiado para ventas fiadas.
- **Estados de Cartera:** Clasificación automática en badges visuales:
  - **DEUDOR** (en rojo con badge `#FDE8E8`): Posee saldo pendiente vencido o por pagar.
  - **AL DÍA** (en verde con badge `#E8F5E9`): Sin deudas activas.
- **Detalle de Cuenta Corriente (`CustomerDebtModal`):** Desglose de compras a crédito pendientes con folio de ticket, fecha y monto original.
- **Recepción de Abonos a Cuenta (`CustomerPaymentModal`):**
  - Registro de pagos parciales o liquidación total con un clic.
  - **Efecto Contable Inmediato:** El dinero abonado se resta del saldo deudor del cliente y **se registra automáticamente como entrada de efectivo en la gaveta de caja del turno activo**.

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/customers/                    # Customer entity, reglas de crédito y abonos
│   ├── ports/customer.repository.ts         # Puerto CustomerRepository
│   ├── adapters/persistence/sqlite/
│   │   ├── customers.sqlite.ts              # Tablas 'customers', 'customer_debts', 'customer_payments'
│   │   └── migrations/                      # Migración de clientes y créditos
│   └── ipc/customers.ipc.ts                 # Handlers 'customers:*'
│
├── shared/contracts/
│   └── customers.contract.ts                # Interfaces Customer, DebtItem, PaymentInput
│
└── renderer/src/features/customers/
    ├── CustomersView.tsx                    # Vista principal con tabla y filtros
    └── components/ (Pendiente de modularización):
        ├── CustomerTable.tsx                # Tabla de clientes y saldos
        ├── AddCustomerModal.tsx             # Modal de alta de cliente [ALT+C]
        ├── CustomerDebtModal.tsx            # Historial de tickets a crédito
        └── CustomerPaymentModal.tsx         # Modal de cobro de abonos
```

---

## 3. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F5]` | Cambiar a pestaña **Clientes & Créditos** |
| `[F1]` | (En Stitch alternativo) Modal de Clientes Rápido |
| `[ALT + C]` | Registrar **Nuevo Cliente** |

---

## 4. Conexiones con Otros Módulos

- ➡️ **Módulo 02 (POS):** Al realizar una venta a crédito, el ticket se añade a las deudas del cliente y se valida contra su límite disponible.
- ➡️ **Módulo 05 (Caja y Turnos):** Cada abono recibido genera una entrada de dinero en la gaveta del cajero que impacta la ecuación de balance.

---

## 5. Tareas Pendientes / Deuda Técnica

- ⚠️ **Refactorización de Líneas:** `CustomersView.tsx` supera las 600 líneas. Debe subdividirse en `CustomerTable.tsx`, `AddCustomerModal.tsx`, `CustomerDebtModal.tsx` y `CustomerPaymentModal.tsx` para cumplir con la norma de $\le 300$ líneas.
