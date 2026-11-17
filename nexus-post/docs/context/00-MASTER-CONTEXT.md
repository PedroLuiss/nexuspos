# 🌐 NEXUSPOS — 00. MASTER CONTEXT & ARCHITECTURAL STANDARDS

> **Propósito para IAs y Desarrolladores:** Este es el contexto maestro obligatorio de NexusPOS Desktop. Define los estándares globales de ingeniería, patrones de diseño, restricciones inviolables de código y el mapa de módulos del sistema. **Cualquier IA debe leer este archivo antes de comenzar cualquier tarea** y luego cargar ÚNICAMENTE el archivo de contexto modular correspondiente a la feature requerida para optimizar el consumo de tokens.

---

## 1. Visión y Ficha Técnica del Proyecto

- **Nombre:** NexusPOS Desktop Enterprise
- **Tipo:** Sistema nativo de Punto de Venta (POS), Facturación rápida, Control de Inventarios, Auditoría Kardex inmutable y Administración de Caja para Windows.
- **Filosofía Operativa:** **Offline-First & Local-First**. React presenta la interfaz; las reglas de negocio y validaciones transaccionales viven en `src/main` y la persistencia local se realiza en SQLite mediante `better-sqlite3`. Los servicios externos (por ejemplo, la tasa USD/VES y el primer acceso remoto) son auxiliares y deben exponer claramente sus errores/fallbacks.
- **Diseño Visual:** **Windows 11 Fluent Design / WinUI 3 ("Fluent POS Engine")**:
  - Paleta: Fondo `#F3F3F3`, Acento primario Windows Blue `#0067C0`, Éxito / Cobro `#107C41`, Error / Merma `#C42B1C`, Texto principal `#1B1B1B`, Subtexto `#5C5C5C`.
  - Tipografía: Monospace tabular para números (`JetBrains Mono` / monospace), sans-serif nativa para UI (`Segoe UI` / `Hanken Grotesk`).
  - Densidad: Tablas densas de 40px por fila, bordes sutiles `#E5E5E5`, sombras suaves WinUI 3 y soporte de desenfoque acrílico (`backdrop-blur`).

---

## 2. Stack Tecnológico Estándar

| Capa | Tecnologías |
| :--- | :--- |
| **Shell Nativo** | Electron + `@electron-toolkit/preload` + `electron-vite` |
| **Frontend UI** | React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons |
| **Persistencia Local** | SQLite nativo mediante `better-sqlite3` + sistema de migraciones versionadas |
| **Arquitectura Backend** | Hexagonal (Puertos y Adaptadores) + Domain-Driven Design (DDD) |
| **Arquitectura Frontend** | Feature-Sliced Design (FSD) |
| **Contratos Compartidos** | TypeScript Interfaces & DTOs en `@shared/contracts` |

---

## 3. Principios y Reglas Inviolables de Código

Cualquier cambio propuesto por una IA o desarrollador DEBE cumplir estrictamente con:

1. **Límites Físicos de Archivos**:
   - ⚠️ Componentes UI: **Máximo 300 líneas**. Si crece, dividir inmediatamente en subcomponentes modulares.
   - ⚠️ Custom Hooks: **Máximo 200 líneas**.
2. **Límites de Importación (Aislamiento FSD estricto)**:
   - ❌ `features/moduloA` **NUNCA** debe importar de `features/moduloB`.
   - ✅ Si dos o más módulos comparten un componente, hook o función, **debe subirse a `src/renderer/src/shared/`**.
   - ❌ `src/renderer/src/shared/ui/` no debe contener llamadas IPC ni lógica de negocio backend.
   - ❌ `src/main/domain/` es lógica pura en TypeScript: **NO debe importar Electron ni SQLite (`better-sqlite3`)**.
3. **Comunicación Segura Main <-> Renderer**:
   - ❌ **Prohibido** usar `remote`, Node APIs directas o `eval` en renderer.
   - ✅ Toda llamada a backend se realiza exclusivamente mediante `window.api.<dominio>.<metodo>()` expuesto por `contextBridge` en `src/preload/index.ts`.
4. **Integridad de Datos**:
   - ✅ **Soft Delete Obligatorio**: Los productos y registros clave NUNCA se eliminan con `DELETE FROM`. Se actualizan a `deleted = 1` y `active = 0` para preservar la integridad de ventas previas y trazabilidad contable en Kardex.

---

## 4. Estructura Canónica de Directorios

```text
nexus-post/src/
├── main/                                    # Proceso Node/Electron (Hexagonal + DDD)
│   ├── index.ts                             # Bootstrap del proceso y BrowserWindow
│   ├── ipc/                                 # Handlers IPC registrados (1 archivo por dominio)
│   │   ├── auth.ipc.ts
│   │   ├── products.ipc.ts
│   │   ├── inventory.ipc.ts
│   │   └── index.ts                         # Registro centralizado de handlers
│   ├── domain/                              # Entidades, Value Objects y Servicios Puros
│   │   ├── auth/                            # Lógica de login, hash, tokens
│   │   ├── products/                        # Reglas de negocio de catálogo
│   │   ├── inventory/                       # Reglas de ajuste y kardex
│   │   └── shared/                          # Entidades base, Result<T>, Money
│   ├── ports/                               # Interfaces de repositorios y servicios externos
│   └── adapters/                            # Implementaciones de infraestructura
│       ├── persistence/sqlite/              # SQLite database, queries y migraciones
│       │   ├── migrations/                  # 001_initial.ts, 002_..., etc.
│       │   └── users.sqlite.ts, products.sqlite.ts, etc.
│       └── hardware/                        # Conectores de básculas e impresoras
│
├── preload/
│   └── index.ts                             # Exposición segura contextBridge (window.api.*)
│
├── shared/
│   └── contracts/                           # Interfaces DTOs, canales IPC tipados
│       ├── auth.contract.ts
│       ├── products.contract.ts
│       └── api.contract.ts
│
└── renderer/src/                            # Frontend React 19 (Feature-Sliced Design)
    ├── app/                                 # Shell global, App.tsx, DashboardLayout
    ├── features/                            # Módulos autónomos
    │   ├── auth/                            # LoginView, ResetPassword, QuickPin
    │   ├── pos/                             # Terminal de ventas, Carrito, Cobro
    │   ├── inventory/                       # Tabla densa, Modales de stock, Barcode
    │   ├── kardex/                          # Auditoría inmutable de movimientos
    │   ├── cash-shift/                      # Corte Z, control de caja y turnos
    │   ├── customers/                       # Créditos, cuentas por cobrar, abonos
    │   ├── reports/                         # KPIs, analítica, gráficos SVG
    │   └── settings/                        # Configuración de hardware, RBAC, DB
    └── shared/                              # UI Reutilizable, Hooks, Utilidades
        ├── ui/                              # Button, Modal, DataTable, Input
        ├── hooks/                           # Hooks compartidos
        ├── icons/                           # Icons.tsx (Lucide-react)
        └── lib/                             # money.ts, dates.ts, validations.ts
```

---

## 5. Índice de Contextos Modulares (Ahorro de Tokens)

Para trabajar de manera eficiente sin saturar la ventana de contexto de la IA, cada módulo del sistema está documentado en su archivo independiente. **Carga solo el archivo necesario para tu tarea:**

| Código | Archivo de Contexto | Descripción del Módulo | Atajo Principal |
| :---: | :--- | :--- | :---: |
| **01** | [`01-AUTH-SESSION.md`](./01-AUTH-SESSION.md) | Login empresarial, PIN rápido, OTP recovery, reset password, RBAC | `[F10]` / `[F1]` |
| **02** | [`02-POS-SALES.md`](./02-POS-SALES.md) | Terminal de ventas, carrito reactivo, cobro normal/rápido/mixto, ticket 80mm | `[F1]` / `[F12]` / `[ALT+Q]` |
| **03** | [`03-INVENTORY-PRODUCTS.md`](./03-INVENTORY-PRODUCTS.md) | Catálogo tabular denso, CRUD, soft delete, ajustes masivos, código de barras | `[F2]` / `[ALT+N]` / `[ALT+B]` |
| **04** | [`04-KARDEX-AUDIT.md`](./04-KARDEX-AUDIT.md) | Trazabilidad inmutable de existencias, motivos de ajuste, auditoría contable | `[F3]` |
| **05** | [`05-CASH-SHIFT.md`](./05-CASH-SHIFT.md) | Arqueo Z, fondo inicial, balance físico vs esperado, gastos y abonos | `[F4]` / `[ALT+G]` |
| **06** | [`06-CUSTOMERS-CREDIT.md`](./06-CUSTOMERS-CREDIT.md) | Cuentas por cobrar, estados de deuda, abonos automáticos a gaveta | `[F5]` / `[ALT+C]` |
| **07** | [`07-REPORTS-ANALYTICS.md`](./07-REPORTS-ANALYTICS.md) | Métricas gerenciales, KPIs de rentabilidad, ranking top ventas, gráficos SVG | `[F6]` |
| **08** | [`08-SETTINGS-HARDWARE.md`](./08-SETTINGS-HARDWARE.md) | Conexión serial RS-232 básculas, impresoras ESC/POS, backup SQLite, permisos | `[F7]` / `[ALT+U]` |

### Estado operativo conocido de los módulos

Este resumen distingue integración persistida de prototipos visuales; no sustituye el contexto específico de cada módulo.

| Módulo | Funcionamiento actual y límites relevantes |
| :--- | :--- |
| **01 Auth** | Usuarios locales se autentican sin red; si no existen localmente, el flujo puede consultar Laravel. Sesión en memoria. Revisar deuda de hash y almacenamiento seguro de tokens en el contexto. |
| **02 POS** | Ventas y pausas se persisten en SQLite. El cobro requiere turno propio abierto y actualiza stock, Kardex, cliente/crédito y caja dentro del flujo transaccional. La impresión física sigue pendiente. |
| **03 Inventario** | Catálogo, categorías y ajustes de existencias están conectados a SQLite; productos utilizan baja lógica. Las ventas y devoluciones también generan sus movimientos de inventario/Kardex. |
| **04 Kardex** | Consulta historial SQLite; ajustes, ventas y devoluciones agregan movimientos desde sus flujos transaccionales. Los movimientos se tratan como append-only. |
| **05 Caja** | Turnos y libro de efectivo persistidos por cajero; historial administrativo de turnos cerrados de todos los cajeros solo para ADMIN, con detalle, tickets y devoluciones sujetas a las reglas del contexto 05. |
| **06 Clientes** | Directorio, créditos y abonos persistidos. Los abonos se asocian al turno; la devolución a crédito cancela deuda pendiente y convierte abonos previos en saldo a favor. |
| **07 Reportes** | La vista todavía usa KPIs, serie temporal y top de productos de demostración; no hay repositorio/servicio/IPC de reportes conectado a SQLite. |
| **08 Ajustes** | Usuarios/RBAC, datos del negocio e impuestos usan SQLite. Configuración y lectura de báscula serial tienen servicio e IPC; impresoras y respaldo/restauración real siguen pendientes. |

---

## 7. Hoja de Ruta Arquitectónica: Escalabilidad Monopuesto a Multi-Caja LAN (WiFi)

> **Directriz Estratégica Obligatoria:** Todo el desarrollo presente debe tener en cuenta que el sistema evolucionará de monopuesto local a sincronización multi-caja en red WiFi/LAN local sin requerir internet obligatorio ni servidores externos en la nube.

```text
┌─────────────────────────────────────────────────────────────┐
│                    RED LOCAL WIFI / LAN                     │
├──────────────────────────────┬──────────────────────────────┤
│  CAJA 1: MAESTRA / SERVIDOR   │  CAJAS 2..N: TERMINALES SATÉLITE
│  - SQLite (Base de datos WAL)│  - UI idéntica (React 19)    │
│  - Microservicio LAN embebido│  - Conexión LAN HTTP/WS      │
│  - Cobro, inventario y turno │  - Sincronización en vivo    │
└──────────────────────────────┴──────────────────────────────┘
```

1. **Fase Actual (Monopuesto Autónomo):**
   - Una sola computadora local (caja física autónoma).
   - Persistencia local en SQLite mediante `better-sqlite3` con `journal_mode = WAL`.
   - Aislamiento estricto de capas mediante Arquitectura Hexagonal.

2. **Fase de Escalado (Multi-Caja Local por WiFi):**
   - **Topología Maestro-Satélite:** La computadora principal (Caja 1) actúa como servidor local de datos, levantando un microservicio interno en Electron (HTTP REST + WebSockets en puerto LAN, ej: `:3001`).
   - **Terminales Satélite:** Las cajas adicionales conectadas a la misma red WiFi se sincronizan con la Caja Maestra en tiempo real (descuento inmediato de stock, bloqueo de folios concurrentes, turnos independientes por cajero).
   - **Transparencia en Frontend:** Como el frontend consume puertos y contratos (`@shared/contracts`) a través de la capa `api/`, cambiar de SQLite local a conexión LAN requerirá únicamente alternar el adaptador de infraestructura sin reescribir componentes visuales ni formularios.
   - **Resiliencia ante Caídas de WiFi:** Las terminales satélite contarán con cola local de ventas (Local Queue) para no frenar la venta en caja si el router WiFi sufre micro-cortes, sincronizando en lote al reanudar enlace.


---

## 8. Protocolo Obligatorio para IAs: Ciclo de Actualización

Cada vez que una IA o programador agregue, modifique o refactorice código en un módulo:
1. **Identificar el módulo afectado** en el índice modular.
2. **Implementar los cambios** respetando las reglas de tamaño (UI $\le 300$, Hooks $\le 200$) y aislamiento FSD.
3. **Actualizar el archivo de contexto del módulo correspondiente** (ej. actualizar el estado actual, nuevas props, canales IPC añadidos o tareas completadas).
4. **Verificar la compilación TypeScript** ejecutando `npx tsc --noEmit`.
