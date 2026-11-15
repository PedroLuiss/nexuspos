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
- **Identidad Comercial y Formato de Ticket:**
  - Razón social, RFC / Identificador fiscal, teléfono de tienda, encabezado y pie de página de comprobantes térmicos.
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

## 3. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/users/
│   │   └── user.service.ts                  # Reglas RBAC, validaciones y guardias de sesión ADMIN
│   ├── ports/
│   │   └── user.repository.ts               # Puerto con búsquedas por usuario/correo (incluye soft-deleted)
│   ├── adapters/persistence/sqlite/
│   │   ├── users.sqlite.ts                  # CRUD + soft delete + saneo de permisos JSON
│   │   └── migrations/007_user_permissions.ts # Columna `permissions` y presets iniciales
│   ├── adapters/hardware/                   # Conectores seriales y sockets térmicos (pendiente)
│   ├── ports/hardware.port.ts               # Interfaces de hardware (pendiente)
│   └── ipc/
│       ├── users.ipc.ts                     # Handlers 'users:*' delegando en UserService
│       ├── settings.ipc.ts                  # Handlers 'settings:*', 'hardware:*' (pendiente)
│       └── index.ts                         # Inyección: UserService(userRepository, authService)
│
├── shared/
│   ├── contracts/
│   │   ├── user.contract.ts                 # PermissionKey, presets por rol, DTOs y UsersApi
│   │   └── api.contract.ts                  # Canales IPC_CHANNELS.users
│   └── lib/permissions.ts (en renderer)     # Helper de gating de pestañas
│
└── renderer/src/
    ├── app/
    │   ├── DashboardLayout.tsx              # Filtra pestañas por permisos
    │   └── router/tabs.config.tsx           # Mapa tab → módulo
    └── features/settings/
        ├── SettingsGrid.tsx                 # Orquestador de tarjetas, feedback y [ALT+U]
        ├── api/users.api.ts                 # Wrapper IPC + fallback en memoria para preview web
        ├── hooks/useUsers.ts                # Estado de usuarios (reload, CRUD, toggle, clearError)
        └── components/
            ├── SettingsCard.tsx             # Tarjeta reutilizable WinUI 3
            ├── UserManagerModal.tsx         # Contenedor del submódulo (búsqueda, filtros, borrado)
            ├── UserTable.tsx                # Tabla densa con guardias de auto-edición
            ├── UserFormModal.tsx            # Alta/edición de credenciales, rol y permisos
            ├── UserPermissionsPicker.tsx    # Matriz de módulos y acciones críticas
            ├── BusinessInfoModal.tsx        # Datos de empresa y ticket
            ├── DatabaseBackupModal.tsx      # Respaldo/restauración SQLite
            └── ScaleSettingsModal.tsx       # Calibración de báscula serial
```

---

## 4. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F7]` | Cambiar a pestaña **Ajustes del Sistema** |
| `[ALT + U]` | Abrir **Gestión de Usuarios, Roles y Permisos** (solo `ADMIN`) |
| `[ALT + A]` | Abrir modal de **Datos de Negocio** (sugerido) |

---

## 5. Tareas Pendientes / Deuda Técnica

- ⚠️ **Persistencia de Ajustes Generales:** identidad comercial, báscula e impresoras aún viven en estado de React; deben migrarse a una tabla `settings` (o `business_config`) con sus canales IPC.
- ⚠️ **Backup real:** `DatabaseBackupModal` solo simula la copia; debe invocar `db.backup()` de `better-sqlite3` vía IPC.
- ⚠️ **Contraseñas:** se comparan en texto plano en `users.password_hash`; migrar a hash con `scrypt`/`argon2` (requiere migración de credenciales).
- ⚠️ **Multi-caja LAN:** los contratos `UsersApi` ya están desacoplados; la fase maestro-satélite solo debe cambiar el adaptador de `UserRepository`, sin tocar UI ni dominio.
