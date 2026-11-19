# 👥 MÓDULO 06 — CLIENTES, CRÉDITOS Y COBRANZAS

> **Contexto Modular:** Este documento contiene la arquitectura, gestión de cartera de clientes, cuentas corrientes y abonos de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Clientes administra el directorio de compradores y la cartera de créditos comerciales:
- **Padrón de Clientes:** Identificación mediante código único (`CLI-xxx`), nombre/razón social, RFC/documento fiscal, teléfono, dirección y email.
- **Administración del directorio:** Alta y edición de datos comerciales; baja lógica para preservar los vínculos históricos.
- **Límites de Crédito:** Asignación de cupo máximo financiado para ventas fiadas.
- **Estados de Cartera:** Clasificación automática en badges visuales:
  - **DEUDOR** (en rojo con badge `#FDE8E8`): Posee saldo pendiente vencido o por pagar.
  - **AL DÍA** (en verde con badge `#E8F5E9`): Sin deudas activas.
- **Detalle de Cuenta Corriente:** Resumen de límite, deuda, crédito disponible y saldo a favor, más tickets pendientes e historial de abonos.
- **Recepción de Abonos a Cuenta:**
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
│   └── customer.contract.ts                 # Contratos Customer, deudas y pagos
│
└── renderer/src/features/customers/
    ├── CustomersView.tsx                    # Orquestación de vistas y operaciones del módulo
    ├── api/customers.api.ts                 # Operaciones por window.api
    ├── hooks/useCustomers.ts                # Carga, CRUD y pagos
    └── components/
        ├── CustomersHeader.tsx               # Encabezado y nivel de operación
        ├── CustomersMetrics.tsx              # Indicadores de clientes y cartera
        ├── CustomersToolbar.tsx               # Búsqueda, filtros y alternancia de listas
        ├── CustomersTable.tsx                 # Directorio y acciones disponibles por rol
        ├── CustomerFormDialog.tsx              # Alta y edición
        ├── CustomerAccountDialog.tsx           # Estado de cuenta e historial
        └── CustomerPaymentDialog.tsx            # Registro de abono
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

- ⚠️ **Paginación del directorio:** el módulo carga el padrón completo para calcular indicadores y alternar activos/desactivados localmente. Si el volumen de clientes crece significativamente, migrar la búsqueda y paginación al repositorio SQLite.

## 6. Estado de Integración con SQLite y POS

- Clientes, deudas y pagos se guardan en SQLite mediante la migración `011_customers` y los canales `customers:*` expuestos por el preload.
- El POS carga los clientes registrados, permite crear un cliente persistente y asociarlo al ticket.
- El método **Crédito** del modal de cobro requiere cliente seleccionado. Al confirmar, crea una deuda con el folio del ticket y valida que el saldo no exceda el límite de crédito; un error deja la venta sin completar.
- Los abonos se registran en una transacción SQLite, se aplican primero a las deudas más antiguas y reducen el saldo del cliente. Tras confirmarse, el POS agrega el importe a los ingresos del turno/caja.
- El listado y el estado de cuenta se cargan desde SQLite; los datos de clientes que antes vivían únicamente en el estado de React fueron retirados de `App.tsx`.
- Las ventas regulares (efectivo/tarjeta/mixto/crédito) y facturas se persisten en SQLite por el módulo POS/Ventas; el cliente seleccionado queda asociado a la venta. No hay que recrear ventas desde Clientes.
- El listado principal muestra solo clientes activos. El botón **Clientes desactivados** carga desde SQLite y muestra en una vista separada los clientes inactivos; estos no se ofrecen para asociar a ventas en el POS.
- El módulo consulta activos e inactivos en su propia vista; al alternar listas, reinicia el filtro de deuda para que no oculte registros desactivados. Los filtros y búsquedas se aplican al subconjunto activo o inactivo correspondiente.
- No se permite desactivar clientes con deuda pendiente: el botón se deshabilita en la interfaz y `CustomerService.toggleStatus` vuelve a validar la regla antes de modificar el estado en SQLite.
- Una devolución de venta a crédito cancela la deuda pendiente; los abonos ya registrados para esa venta no se eliminan, se convierten en saldo a favor del cliente (`credit_balance`). El saldo a favor se expone en el estado de cuenta del cliente.
- Los abonos requieren un turno abierto del usuario y se persisten junto con su movimiento de ingreso en caja; el flujo transaccional coordina `CustomerService`, `CashRepository` y SQLite.
- Los permisos de la interfaz corresponden a las reglas del dominio: ADMIN puede crear/editar/dar de baja y activar/desactivar; ADMIN y CASHIER pueden registrar abonos, pero la acción se deshabilita si no hay turno de caja abierto. Los demás roles autorizados al módulo tienen consulta.
- La baja es lógica (`deleted = 1`, `active = 0`) y el dominio impide dar de baja clientes con deuda pendiente; el historial de ventas, pagos y movimientos se conserva.
- La deuda de una venta solo se genera desde `SalesService` en el flujo transaccional del POS. Ya no existe un canal IPC independiente para crear deudas, evitando insertar una deuda sin la venta asociada.
- La vista usa `useConfirmDialog` para confirmar la baja y los cambios de estado; no usa `window.confirm`.
- La tabla del directorio carga el padrón completo actualmente; no tiene paginación.
