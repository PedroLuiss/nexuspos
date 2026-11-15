# ⚙️ MÓDULO 08 — AJUSTES, HARDWARE Y ADMINISTRACIÓN DE BASE DE DATOS

> **Contexto Modular:** Este documento contiene la arquitectura de periféricos (RS-232, ESC/POS), seguridad granular RBAC y respaldos SQLite de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Ajustes centraliza los parámetros críticos del sistema y la comunicación con periféricos de tienda:

- **Usuarios, Roles y Permisos (RBAC persistido en SQLite):**
  - Submódulo real (no demostrativo) para alta, edición, activación/desactivación y baja lógica de operadores.
  - **Exclusivo del rol `ADMIN`**: el acceso se valida por rol en dominio (`UserService`) y se refleja en la UI (tarjeta deshabilitada, modal de "Acceso restringido" y pestaña oculta si no tiene permiso de `settings`).
  - **Permisos de módulo** (controlan qué pestañas ve el operador):
    - `pos`, `inventory`, `kardex`, `cash`, `customers`, `reports`, `settings`
  - **Permisos de acción** (operaciones sensibles):
    - `CAN_DELETE_PRODUCT`, `CAN_MODIFY_PRICE`, `CAN_APPLY_DISCOUNT`,
      `CAN_MANUAL_CASH_MOVEMENTS`, `CAN_OVERRIDE_NO_STOCK`, `MANAGE_USERS`.
    - `MANAGE_USERS` se muestra bloqueado y **solo lo posee el rol `ADMIN`**.
  - **Presets por rol** (`ROLE_DEFAULT_PERMISSIONS` en `@shared/contracts`): se aplican al crear un usuario o al cambiar de rol sin enviar permisos explícitos.
  - El Administrador siempre obtiene el catálogo completo (`ADMIN_PERMISSION_KEYS`), independientemente de la matriz guardada.
  - Reglas de integridad: no puede auto-desactivarse ni auto-eliminarse, y siempre debe quedar al menos un `ADMIN` activo.
  - La "eliminación" es **soft delete** (`active = 0`): el registro permanece visible como inactivo para preservar la trazabilidad de Kardex y auditoría.
- **Identidad Comercial, Propietario y Formato de Ticket (persistido en SQLite):**
  - Tabla de fila única `business_settings` (migración `008_business_settings.ts`) con seed demostrativo editable para Venezuela.
  - Identidad legal: razón social, nombre comercial, tipo de identificación fiscal (`RIF` o `NONE`), número de RIF (formato SENIAT: `J-00000000-0`, prefijos J/V/E/G/P) y régimen tributario.
  - Propietario / representante legal: nombre y documento (Cédula de Identidad / RIF).
  - Contacto: correo, teléfono fijo (+58), celular / WhatsApp y sitio web.
  - Domicilio fiscal: dirección, distrito / urbanización, ciudad, estado, municipio, parroquia, país (Venezuela) y código postal.
  - Operación: moneda (`VES` Bolívar Soberano, `USD` Dólar, `EUR` Euro — catálogo extensible para agregar más monedas).
  - Plantilla de ticket 80mm: encabezado, pie, leyenda legal (ej. "Documento no fiscal. Sujeto a regulación del SENIAT") y toggles para imprimir RIF, domicilio y cajero.
- **Impuestos (IVA) gestionados desde Ajustes:**
  - `taxEnabled`, `taxName` (por defecto "IVA"), `taxRate` (porcentaje 0–100, configurable, por defecto 16%) y `pricesIncludeTax`.
  - La configuración se aplica realmente en el POS, el cobro rápido, el corte de caja y el ticket térmico.
  - Modo "impuesto incluido": el impuesto se desagrega del precio sin sumarse al total; en caso contrario se suma al subtotal.
  - El IVA es totalmente configurable desde el módulo de Ajustes (tarjeta "Impuestos y Facturación").
- **Conexión de Báscula por Puerto Serial (RS-232 / COM):**
  - Comunicación con balanzas de peso comercial (Torrey, Rhino, Dibal) mediante lectura de buffer serial.
  - Parámetros: Puerto (`COM1` a `COM4`), velocidad en baudios (9600, 19200 bps), lectura en vivo de peso estabilizado.
- **Configuración de Impresoras Térmicas y Periféricos:**
  - Selección de driver ESC/POS, ancho de papel (58mm o 80mm), corte automático y pulso de cajón de dinero.
- **Mantenimiento y Respaldo de Base de Datos SQLite:**
  - Exportación de copias de seguridad locales (`.sqlite`) con sello de fecha.
  - Asistente de restauración de base de datos con verificación previa.

---

## 2. Flujo del Submódulo de Usuarios (Renderer → IPC → SQLite)

```text
SettingsGrid (F7)
  └─ [ALT+U] / botón "Gestionar Usuarios"  (solo si currentUser.role === 'ADMIN')
       └─ UserManagerModal
            ├─ búsqueda por nombre/usuario/correo + filtro por rol + recarga
            ├─ UserTable (editar / activar-desactivar / eliminar soft delete)
            └─ UserFormModal
                 ├─ credenciales: nombre, usuario, correo, contraseña, PIN 4 dígitos
                 ├─ selector de rol (preset automático de permisos)
                 └─ UserPermissionsPicker (módulos + acciones críticas)

useUsers(enabled)  →  users.api.ts  →  window.api.users.*  →  IPC  →  UserService  →  SqliteUserRepository
                                                                   (guardia ADMIN)     (tabla users)
```

### Canales IPC (`IPC_CHANNELS.users`)

| Canal | Acción | Autorización |
| :--- | :--- | :--- |
| `users:list` | Lista todos los usuarios (incluye inactivos) | Sesión `ADMIN` |
| `users:getById` | Obtiene un usuario por id | Sesión `ADMIN` |
| `users:create` | Crea operador con rol y permisos | Sesión `ADMIN` |
| `users:update` | Edita datos, rol, permisos y estado | Sesión `ADMIN` |
| `users:delete` | Baja lógica (`active = 0`) | Sesión `ADMIN` |
| `users:toggleStatus` | Activa / desactiva la cuenta | Sesión `ADMIN` |

### Gating de módulos en el renderer

- `shared/lib/permissions.ts`: `getUserPermissions`, `hasPermission`, `canAccessTab`, `canManageUsers`.
- `DashboardLayout` filtra `TABS_CONFIG` según permisos y redirige la pestaña activa si deja de estar autorizada.
- `App.tsx` vuelve a validar `canAccessTab` antes de renderizar cada módulo (defensa en profundidad).
- `pos` es el núcleo operativo y **siempre** está disponible para cualquier sesión autenticada.

---

## 3. Flujo de Datos del Negocio, Ticket e Impuestos (Renderer → IPC → SQLite)

```text
SettingsGrid (F7)
  ├─ [ALT+A] / "Editar Datos"        → BusinessInfoModal   (tabs: Negocio y Propietario | Plantilla de Ticket)
  └─ [ALT+T] / "Configurar IVA"      → TaxSettingsModal    (tasa, nombre, precio con impuesto incluido)

BusinessConfigProvider (app/providers)
  └─ useBusinessConfig()  →  settings.api.ts  →  window.api.settings.*
        └─ IPC → SettingsService (guardia ADMIN en escritura) → SqliteSettingsRepository
                                                               (tabla business_settings, fila 'default')

Consumidores de la configuración:
  POSView · SaleModal · TicketPreviewModal · CashShiftView · ProductPricingFields
```

### Canales IPC (`IPC_CHANNELS.settings`)

| Canal | Acción | Autorización |
| :--- | :--- | :--- |
| `settings:getBusiness` | Lee la configuración única del establecimiento | Cualquier sesión (el POS necesita la tasa) |
| `settings:updateBusiness` | Persiste identidad, propietario, contacto, domicilio, ticket e impuestos | Sesión `ADMIN` |

### Reglas de validación del dominio (`SettingsService`)

- Razón social obligatoria; longitud máxima 160 caracteres.
- Si `taxIdType === 'RIF'`, el número de RIF debe tener formato válido venezolano (ej. `J-00000000-0`, prefijos J/V/E/G/P).
- Correo con formato válido cuando se informa; se normaliza a minúsculas.
- Moneda (`VES`, `USD`, `EUR`) y tipo de identificación fiscal (`RIF`, `NONE`) deben pertenecer al catálogo de `@shared/contracts`.
- `taxRate` debe ser un porcentaje finito entre `0` y `100`.
- Con `taxEnabled` activo, `taxName` no puede quedar vacío (fallback `IVA`).
- País por defecto: Venezuela.
- `updatedAt` / `updatedBy` se generan en el adaptador; el renderer nunca los envía.
- Auto-reparación: si la fila `default` no existe, el adaptador la recrea con valores de fábrica.

---

## 4. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/users/
│   │   └── user.service.ts                  # Reglas RBAC, validaciones y guardias de sesión ADMIN
│   ├── domain/settings/
│   │   └── settings.service.ts              # Validaciones fiscales/tributarias y guardia ADMIN
│   ├── ports/
│   │   ├── user.repository.ts               # Puerto con búsquedas por usuario/correo (incluye soft-deleted)
│   │   └── settings.repository.ts           # Puerto getBusiness/updateBusiness
│   ├── adapters/persistence/sqlite/
│   │   ├── users.sqlite.ts                  # CRUD + soft delete + saneo de permisos JSON
│   │   ├── settings.sqlite.ts               # Fila única 'default' + auto-reparación + auditoría (municipio, parroquia)
│   │   └── migrations/
│   │       ├── 007_user_permissions.ts      # Columna `permissions` y presets iniciales
│   │       └── 008_business_settings.ts     # Tabla `business_settings` y seed demostrativo (Venezuela, RIF, VES)
│   ├── adapters/hardware/                   # Conectores seriales y sockets térmicos (pendiente)
│   ├── ports/hardware.port.ts               # Interfaces de hardware (pendiente)
│   └── ipc/
│       ├── users.ipc.ts                     # Handlers 'users:*' delegando en UserService
│       ├── settings.ipc.ts                  # Handlers 'settings:getBusiness' / 'settings:updateBusiness'
│       └── index.ts                         # Inyección: UserService, SettingsService, SqliteSettingsRepository
│
├── shared/
│   ├── contracts/
│   │   ├── user.contract.ts                 # PermissionKey, presets por rol, DTOs y UsersApi
│   │   ├── settings.contract.ts             # BusinessConfig, monedas VES/USD/EUR, tipos RIF/NONE y SettingsApi
│   │   └── api.contract.ts                  # Canales IPC_CHANNELS.users / .settings
│   └── lib/permissions.ts (en renderer)     # Helper de gating de pestañas
│
└── renderer/src/
    ├── app/
    │   ├── DashboardLayout.tsx              # Filtra pestañas por permisos
    │   ├── providers/BusinessConfigProvider.tsx # Carga/guarda configuración y refresca el contexto
    │   └── router/tabs.config.tsx           # Mapa tab → módulo
    ├── shared/
    │   ├── hooks/useBusinessConfig.ts       # Contexto global de negocio/ticket/impuestos
    │   └── lib/businessConfig.ts            # Defaults (Venezuela, VES, RIF, IVA), formato de dirección, isValidRif, cálculo de impuesto
    └── features/settings/
        ├── SettingsGrid.tsx                 # Orquestador de tarjetas, feedback y [ALT+U/A/T]
        ├── api/users.api.ts                 # Wrapper IPC + fallback en memoria para preview web
        ├── api/settings.api.ts              # Wrapper IPC de configuración del negocio
        ├── hooks/useUsers.ts                # Estado de usuarios (reload, CRUD, toggle, clearError)
        └── components/
            ├── SettingsCard.tsx             # Tarjeta reutilizable WinUI 3
            ├── UserManagerModal.tsx         # Contenedor del submódulo (búsqueda, filtros, borrado)
            ├── UserTable.tsx                # Tabla densa con guardias de auto-edición
            ├── UserFormModal.tsx            # Alta/edición de credenciales, rol y permisos
            ├── UserPermissionsPicker.tsx    # Matriz de módulos y acciones críticas
            ├── BusinessInfoModal.tsx        # Contenedor 2 tabs (negocio/propietario + ticket)
            ├── BusinessIdentityForm.tsx     # Identidad fiscal, propietario, contacto y domicilio
            ├── TicketTemplateForm.tsx       # Encabezado, pie, leyenda legal y toggles
            ├── TaxSettingsModal.tsx         # IVA configurable (tasa, nombre, precio con impuesto incluido) + simulación Bs.
            ├── DatabaseBackupModal.tsx      # Respaldo/restauración SQLite
            └── ScaleSettingsModal.tsx       # Calibración de báscula serial
```

---

## 5. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F7]` | Cambiar a pestaña **Ajustes del Sistema** |
| `[ALT + U]` | Abrir **Gestión de Usuarios, Roles y Permisos** (solo `ADMIN`) |
| `[ALT + A]` | Abrir **Datos del Negocio y Plantilla de Ticket** (solo `ADMIN`) |
| `[ALT + T]` | Abrir **Impuestos y Facturación (IVA)** (solo `ADMIN`) |

---

## 6. Tareas Pendientes / Deuda Técnica

- ⚠️ **Báscula e impresoras:** sus parámetros aún viven en estado de React; deben persistirse en tablas propias con sus canales IPC.
- ⚠️ **Backup real:** `DatabaseBackupModal` solo simula la copia; debe invocar `db.backup()` de `better-sqlite3` vía IPC.
- ⚠️ **Contraseñas:** se comparan en texto plano en `users.password_hash`; migrar a hash con `scrypt`/`argon2` (requiere migración de credenciales).
- ⚠️ **Impuesto por producto:** `hasTax` decide si el producto es gravable, pero la tasa es global; evaluar tasas múltiples (exento / tasa reducida) en una fase posterior.
- ⚠️ **Multi-caja LAN:** los contratos `UsersApi` y `SettingsApi` ya están desacoplados; la fase maestro-satélite solo debe cambiar los adaptadores de repositorio, sin tocar UI ni dominio.
