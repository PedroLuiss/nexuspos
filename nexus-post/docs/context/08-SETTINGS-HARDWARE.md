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
- **Impuestos multi-alícuota gestionados desde Ajustes:**
  - **Catálogo `taxes` (migración `015_taxes.ts`):** cada tasa guarda nombre, porcentaje (0–100), código fiscal corto opcional (`G`, `R`, `E`…), estado activo y marca de predeterminada. Semillas iniciales: `Exento` 0%, `IVA General` 16% (predeterminada), `IVA Reducido` 8% e `IVA Adicional` 31%. Se pueden crear, editar, desactivar y eliminar tasas personalizadas.
  - **Reglas del catálogo:** solo puede existir una tasa predeterminada (índice único parcial); el nombre es único sin distinguir mayúsculas; la tasa predeterminada no se puede eliminar y una tasa con productos asignados tampoco (debe reasignarse primero). El borrado es lógico (`deleted = 1`).
  - **Permisos:** lectura pública para cualquier sesión (el POS necesita las alícuotas); escritura restringida a rol `ADMIN` validada en `TaxService` además de la UI.
  - **Interruptor global:** `taxEnabled` (aplicar impuesto en ventas) y `pricesIncludeTax` (los precios de venta ya incluyen impuesto). `taxName`/`taxRate` se mantienen como respaldo histórico y se sincronizan con la tasa predeterminada al guardar.
  - La matemática fiscal es única y compartida (`src/shared/lib/tax.ts`): el POS muestra el desglose por tasa y el backend recalcula la venta antes de persistirla; el desglose se guarda en `sale_taxes`.
  - Modo "impuesto incluido": el impuesto se desagrega del precio sin sumarse al total; en caso contrario se suma al subtotal.
- **Conexión de Báscula por Puerto Serial (RS-232 / COM):**
  - Comunicación con balanzas de peso comercial (Torrey, Rhino, Dibal) mediante lectura de buffer serial.
  - Parámetros: Puerto (`COM1` a `COM4`), velocidad en baudios (9600, 19200 bps), lectura en vivo de peso estabilizado.
- **Impresoras Térmicas y Periféricos (pendiente):**
  - La configuración/impresión ESC/POS, ancho de papel, corte automático y pulso de gaveta todavía no están conectados a un adaptador de hardware.
- **Mantenimiento y Respaldo de Base de Datos SQLite (operativo para ADMIN):**
  - Estado de integridad (`PRAGMA integrity_check`), tamaño (base + WAL), páginas reutilizables, versión de esquema, conteos de productos/facturas/clientes y fecha de último respaldo.
  - Copia consistente mediante `better-sqlite3.backup()` en `userData/backups`, validada abriendo el respaldo, revisando integridad/esquema y calculando SHA-256. El historial presenta los últimos 20 archivos.
  - La optimización crea primero un respaldo de seguridad, ejecuta checkpoint WAL, `PRAGMA optimize` y `VACUUM`.
  - La restauración selecciona un archivo `.sqlite`, `.sqlite3` o `.db`; valida integridad, tablas y versión compatible, crea un respaldo preventivo, reemplaza la base activa y reinicia NexusPOS.
  - Las operaciones están validadas por rol `ADMIN` en `DatabaseMaintenanceService` además de ocultar/deshabilitar la tarjeta en la interfaz.
  - El envío a Laravel está implementado como carga multipart `POST` (archivo en `database`, además de `created_at`, `sha256` y `source`). Se activa únicamente configurando `NEXUS_BACKUP_API_URL`; `NEXUS_BACKUP_API_TOKEN` es opcional para Bearer. La API aún no está publicada ni se configuró el URL; sin endpoint, se crea el respaldo local y el modal informa que el envío está pendiente.
  - **Privacidad de la interfaz:** el panel muestra únicamente el estado operativo y la fecha del último respaldo. El IPC transmite resúmenes sin nombres de archivo, extensiones, rutas, motor, esquema, conteos, tamaños ni detalles técnicos; estos permanecen en el flujo interno de mantenimiento.

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

| Canal                | Acción                                       | Autorización   |
| :------------------- | :------------------------------------------- | :------------- |
| `users:list`         | Lista todos los usuarios (incluye inactivos) | Sesión `ADMIN` |
| `users:getById`      | Obtiene un usuario por id                    | Sesión `ADMIN` |
| `users:create`       | Crea operador con rol y permisos             | Sesión `ADMIN` |
| `users:update`       | Edita datos, rol, permisos y estado          | Sesión `ADMIN` |
| `users:delete`       | Baja lógica (`active = 0`)                   | Sesión `ADMIN` |
| `users:toggleStatus` | Activa / desactiva la cuenta                 | Sesión `ADMIN` |

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
  └─ [ALT+T] / "Impuestos"           → TaxSettingsModal
       ├─ interruptor global (taxEnabled) + precios con impuesto incluido
       └─ TaxCatalogEditor → useTaxes() → window.api.taxes.* → IPC → TaxService → SqliteTaxRepository
                                                                     (guardia ADMIN)     (tabla taxes)

BusinessConfigProvider (app/providers)
  └─ useBusinessConfig()  →  settings.api.ts  →  window.api.settings.*
        └─ IPC → SettingsService (guardia ADMIN en escritura) → SqliteSettingsRepository
                                                               (tabla business_settings, fila 'default')

Consumidores de la configuración:
  POSView · SaleModal · TicketPreviewModal · CashShiftView · ProductTaxField
```

### Canales IPC (`IPC_CHANNELS.taxes`)

| Canal               | Acción                                                         | Autorización                    |
| :------------------ | :------------------------------------------------------------- | :------------------------------ |
| `taxes:list`        | Lista el catálogo (incluye inactivas por defecto)               | Cualquier sesión                |
| `taxes:create`      | Crea una alícuota                                               | Sesión `ADMIN`                  |
| `taxes:update`      | Edita nombre, tasa, código o estado                            | Sesión `ADMIN`                  |
| `taxes:setDefault`  | Marca la tasa aplicada a productos nuevos                       | Sesión `ADMIN`                  |
| `taxes:remove`      | Borrado lógico (bloqueado si es predeterminada o tiene productos) | Sesión `ADMIN`                  |

### Canales IPC (`IPC_CHANNELS.settings`)

| Canal                     | Acción                                                                   | Autorización                               |
| :------------------------ | :----------------------------------------------------------------------- | :----------------------------------------- |
| `settings:getBusiness`    | Lee la configuración única del establecimiento                           | Cualquier sesión (el POS necesita la tasa) |
| `settings:updateBusiness` | Persiste identidad, propietario, contacto, domicilio, ticket e impuestos | Sesión `ADMIN`                             |

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
│   ├── domain/taxes/
│   │   ├── tax.entity.ts                    # Normalización, validaciones y guardas de borrado
│   │   └── tax.service.ts                   # CRUD del catálogo con guardia ADMIN
│   ├── domain/brands/
│   │   ├── brand.entity.ts                  # Normalización y validaciones de marcas
│   │   └── brand.service.ts                 # CRUD de marcas
│   ├── domain/suppliers/
│   │   ├── supplier.entity.ts               # Normalización y validaciones de proveedores
│   │   └── supplier.service.ts              # CRUD de proveedores
│   ├── domain/product-types/
│   │   ├── product-type.entity.ts           # Normalización y validaciones de tipos
│   │   └── product-type.service.ts          # CRUD de tipos de producto
│   ├── ports/
│   │   ├── user.repository.ts               # Puerto con búsquedas por usuario/correo (incluye soft-deleted)
│   │   ├── tax.repository.ts                # Puerto findAll/findDefault/create/update/softDelete/countProducts
│   │   ├── brand.repository.ts              # Puerto BrandRepository
│   │   ├── supplier.repository.ts           # Puerto SupplierRepository
│   │   ├── product-type.repository.ts       # Puerto ProductTypeRepository
│   │   └── settings.repository.ts           # Puerto getBusiness/updateBusiness
│   ├── adapters/persistence/sqlite/
│   │   ├── users.sqlite.ts                  # CRUD + soft delete + saneo de permisos JSON
│   │   ├── taxes.sqlite.ts                  # Catálogo de alícuotas + tasa predeterminada única
│   │   ├── brands.sqlite.ts                 # CRUD de marcas
│   │   ├── suppliers.sqlite.ts              # CRUD de proveedores
│   │   ├── product-types.sqlite.ts          # CRUD de tipos de producto
│   │   ├── settings.sqlite.ts               # Fila única 'default' + auto-reparación + auditoría (municipio, parroquia)
│   │   └── migrations/
│   │       ├── 007_user_permissions.ts      # Columna `permissions` y presets iniciales
│   │       ├── 008_business_settings.ts     # Tabla `business_settings` y seed demostrativo (Venezuela, RIF, VES)
│   │       ├── 015_taxes.ts                 # Tabla `taxes`, seed de alícuotas y `products.tax_id`
│   │       └── 016_brands_suppliers_product_types.ts  # Tablas brands, suppliers, product_types + columnas en products
│   ├── adapters/hardware/
│   │   ├── scale.serial.ts                  # Puerto serial para báscula (SerialPort)
│   │   └── scale.sqlite.ts                  # Persistencia de configuración
│   ├── ports/hardware.port.ts               # Puertos de báscula/configuración
│   └── ipc/
│       ├── users.ipc.ts                     # Handlers 'users:*' delegando en UserService
│       ├── settings.ipc.ts                  # Handlers 'settings:getBusiness' / 'settings:updateBusiness'
│       └── index.ts                         # Inyección: UserService, SettingsService, SqliteSettingsRepository
│
├── shared/
│   ├── contracts/
│   │   ├── user.contract.ts                 # PermissionKey, presets por rol, DTOs y UsersApi
│   │   ├── settings.contract.ts             # BusinessConfig, monedas VES/USD/EUR, tipos RIF/NONE y SettingsApi
│   │   ├── tax.contract.ts                  # TaxRate, TaxInput y TaxesApi
│   │   ├── brand.contract.ts                # Brand, BrandInput y BrandFilter
│   │   ├── supplier.contract.ts             # Supplier, SupplierInput y SupplierFilter
│   │   ├── product-type.contract.ts         # ProductType, ProductTypeInput y ProductTypeFilter
│   │   └── api.contract.ts                  # Canales IPC_CHANNELS.users / .settings / .taxes / .brands / .suppliers / .productTypes
│   ├── lib/tax.ts                           # Motor de cálculo fiscal compartido (main + renderer)
│   └── lib/permissions.ts (en renderer)     # Helper de gating de pestañas
│
└── renderer/src/
    ├── app/
    │   ├── DashboardLayout.tsx              # Filtra pestañas por permisos
    │   ├── providers/BusinessConfigProvider.tsx # Carga/guarda configuración y refresca el contexto
    │   └── router/tabs.config.tsx           # Mapa tab → módulo
    ├── shared/
    │   ├── hooks/useBusinessConfig.ts       # Contexto global de negocio/ticket/impuestos
    │   ├── hooks/useTaxes.ts                # Estado del catálogo de alícuotas (CRUD + predeterminada)
    │   ├── hooks/useBrands.ts               # Estado del catálogo de marcas
    │   ├── hooks/useSuppliers.ts            # Estado del catálogo de proveedores
    │   ├── hooks/useProductTypes.ts         # Estado del catálogo de tipos de producto
    │   └── lib/businessConfig.ts            # Defaults (Venezuela, VES, RIF), dirección e isValidRif
    └── features/settings/
        ├── SettingsGrid.tsx                 # Orquestador de tarjetas, feedback y [ALT+U/A/T/O]
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
            ├── TaxSettingsModal.tsx         # Interruptor global + IVA incluido + simulación
            ├── TaxCatalogEditor.tsx         # CRUD del catálogo de alícuotas (ADMIN)
            ├── CatalogEditor.tsx            # Editor genérico de catálogos (marcas, proveedores, tipos)
            ├── ProductCatalogsSettingsModal.tsx  # Modal de gestión de catálogos de producto
            ├── DatabaseBackupModal.tsx      # Integridad, historial, respaldo, optimización y restauración
            └── ScaleSettingsModal.tsx       # Calibración de báscula serial
```

---

## 5. Atajos de Teclado del Módulo

|    Atajo    | Acción                                                           |
| :---------: | :--------------------------------------------------------------- |
|   `[F7]`    | Cambiar a pestaña **Ajustes del Sistema**                        |
| `[ALT + U]` | Abrir **Gestión de Usuarios, Roles y Permisos** (solo `ADMIN`)   |
| `[ALT + A]` | Abrir **Datos del Negocio y Plantilla de Ticket** (solo `ADMIN`) |
| `[ALT + T]` | Abrir **Impuestos y Facturación** (solo `ADMIN`)                 |
| `[ALT + O]` | Abrir **Catálogos de Producto** (marcas, proveedores, tipos) (solo `ADMIN`) |

---

## 6. Tareas Pendientes / Deuda Técnica

- ⚠️ **Impresora y gaveta:** no existe integración física ESC/POS ni pulso de gaveta; la previsualización del ticket no imprime.
- ⚠️ **Endpoint de respaldo Laravel:** falta publicar/configurar el endpoint compatible con el multipart documentado y establecer `NEXUS_BACKUP_API_URL`; hasta entonces solo está activo el respaldo local verificado.
- ⚠️ **Recuperación ante falla eléctrica durante restauración:** hacer prueba manual en Windows con copias reales antes de certificar el flujo como recuperación de contingencia.
- ⚠️ **Validación con hardware físico:** el adaptador serial y el flujo IPC existen, pero la integración debe probarse con los modelos y protocolos reales de báscula soportados antes de certificarla para producción.
- ⚠️ **Contraseñas:** se comparan en texto plano en `users.password_hash`; migrar a hash con `scrypt`/`argon2` (requiere migración de credenciales).
- ✅ **Impuesto multi-alícuota por producto:** implementado con el catálogo `taxes` + `products.tax_id` + desglose `sale_taxes` (migración 015). Pendiente: reportes fiscales que agrupen por tasa y libro de ventas exportable.
- ✅ **Catálogos de producto (marcas, proveedores, tipos):** implementado con migración 016 (`brands`, `suppliers`, `product_types` + columnas en `products`), servicios de dominio, IPC, renderer y formularios de producto. Pendiente: validar que no se elimine un catálogo con productos asignados desde el dominio (ya aplicado).
- ⚠️ **Multi-caja LAN:** los contratos `UsersApi` y `SettingsApi` ya están desacoplados; la fase maestro-satélite solo debe cambiar los adaptadores de repositorio, sin tocar UI ni dominio.

## 7. Estado de integración

- Usuarios, roles/permisos, identidad comercial, plantilla de ticket e impuestos se leen/guardan mediante servicios e IPC conectados a SQLite; las guardias de administración se validan en `main`.
- La configuración de báscula está persistida y expuesta por IPC. `ScaleService` controla permisos para configurar/abrir/cerrar el puerto, y `SerialScaleAdapter` implementa enumeración de puertos y lectura serial.
- `SettingsGrid` todavía conserva parte del estado de conexión de la báscula en React para presentar el estado de UI; la configuración persistente es la fuente de parámetros.
- El mantenimiento de DB usa los canales `database:getStatus`, `database:listBackups`, `database:createBackup`, `database:verifyIntegrity`, `database:optimize` y `database:restoreBackup`; las mutaciones y consultas administrativas requieren `ADMIN` en backend.
- Los respaldos locales quedan en `app.getPath('userData')/backups`. La restauración guarda primero un respaldo preventivo y requiere reiniciar la aplicación para reabrir la conexión en la base recuperada.
- El endpoint Laravel es configurable, no hardcodeado. Si `NEXUS_BACKUP_API_URL` está vacía, ninguna solicitud remota se intenta; la copia local se completa y su respuesta indica `not-configured`. Un error HTTP conserva el respaldo local e informa `failed`.
- El cajero recibe `CAN_MANUAL_CASH_MOVEMENTS` por el preset de rol y la migración de Caja, mientras que la administración de usuarios y permisos permanece exclusiva de ADMIN.
