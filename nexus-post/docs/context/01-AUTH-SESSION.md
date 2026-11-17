# 🔐 MÓDULO 01 — AUTH & SESSION MANAGEMENT (LOCAL-FIRST + LARAVEL BOOTSTRAP)

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, integración con la API de Laravel y reglas del módulo de Autenticación, Sesión y Seguridad de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad y Modelo de Negocio

El acceso a NexusPOS Desktop opera bajo un modelo de suscripción con **arranque remoto único** y operación local permanente:

1. **Registro en Landing Page Web:** El comercio se registra y adquiere su suscripción en la Landing Page (React Web + Laravel API).
2. **Descarga del Instalador Desktop:** Con la cuenta creada, descarga el sistema POS de escritorio (SQLite vacío salvo semillas de catálogo).
3. **Primer inicio de sesión (bootstrap remoto):** Si el identificador **no existe** en SQLite local, se consume `POST /api/v1/auth/login` de Laravel. Si el acceso es exitoso, la aplicación **crea de inmediato el usuario `ADMIN` en SQLite** con la contraseña y PIN usados/recibidos, y con el catálogo completo de permisos.
4. **Sesiones posteriores (100% local):** Como el usuario ya existe en SQLite, el login se resuelve contra la base local **sin llamar a Laravel**, garantizando velocidad y operación Offline-First.

> **Regla de oro:** La API de Laravel solo se consulta cuando el identificador (usuario/correo o PIN) **no existe localmente**. Nunca se consulta en cada inicio de sesión.

---

## 2. Flujo de Autenticación

### 2.1 Login con credenciales (`auth:login`)

```text
LoginInput (emailOrUsername + password)
      │
      ├─ Paso 1: userRepository.findByEmailOrUsername(identifier)
      │     ├─ Existe → compara passwordHash en SQLite
      │     │     ├─ Correcto → sesión OK (sin red)
      │     │     └─ Incorrecto → error "Contraseña incorrecta"
      │     └─ No existe → Paso 2
      │
      └─ Paso 2: remoteAuth.login(input)  (Laravel)
            ├─ success → userRepository.create({ role: 'ADMIN', ... })
            │             └─ Si colisiona (ya existe por usuario/correo) se reutiliza el registro
            │                activo en lugar de bloquear el acceso
            └─ fail / sin red → error de credenciales o de conexión
```

### 2.2 Login rápido por PIN (`auth:loginPin`)

1. **SQLite primero:** `findByPin(pin)` con `active = 1` → sesión inmediata, sin red.
2. **Laravel después:** solo si el PIN no existe localmente (cajeros creados únicamente en la nube).
3. Sin conexión y sin PIN local → `PIN de cajero no reconocido.`

### 2.3 Sesión en memoria

- `AuthService.currentUser` guarda la sesión activa y se expone a través de `getSessionUser()`.
- `UserService` usa esa sesión para autorizar todas las operaciones de usuarios (`role === 'ADMIN'`).
- `logout()` limpia la sesión local y revoca el token remoto si existe; **nunca lanza excepción** al renderer.

---

## 3. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/auth/
│   │   ├── auth.service.ts                  # Login local-first + bootstrap ADMIN + sesión
│   │   └── user.entity.ts                   # Entidad User y roles
│   ├── domain/users/
│   │   └── user.service.ts                  # RBAC: solo sesión ADMIN gestiona usuarios
│   ├── ports/
│   │   ├── user.repository.ts               # Puerto UserRepository (SQLite local)
│   │   └── remote-auth.port.ts              # Puerto RemoteAuthPort (API Laravel)
│   ├── adapters/
│   │   ├── remote/
│   │   │   └── laravel-auth.adapter.ts      # Cliente HTTP nativo contra endpoints de Laravel
│   │   └── persistence/sqlite/
│   │       ├── users.sqlite.ts              # Consultas preparadas, incluye findByUsername/Email
│   │       └── migrations/
│   │           ├── 004_users.ts             # Tabla 'users' con cajero inicial sembrado
│   │           └── 007_user_permissions.ts  # Columna JSON 'permissions' + presets
│   └── ipc/
│       ├── auth.ipc.ts                      # Handlers 'auth:*'
│       ├── users.ipc.ts                     # Handlers 'users:*' (delegados a UserService)
│       └── index.ts                         # DI: LaravelAuthAdapter → AuthService → UserService
│
├── preload/
│   └── index.ts                             # Expone api.auth.* y api.users.* al renderer
│
├── shared/
│   ├── config/
│   │   └── api.config.ts                    # URL base y endpoints de Laravel
│   └── contracts/
│       ├── auth.contract.ts                 # User, LoginInput, PinLoginInput, AuthResponse
│       ├── user.contract.ts                 # PermissionKey, presets por rol, UsersApi
│       └── api.contract.ts                  # Canales IPC_CHANNELS.auth / .users
│
└── renderer/src/
    ├── shared/lib/permissions.ts            # getUserPermissions / canAccessTab / canManageUsers
    ├── shared/hooks/useToast.ts             # Estado de alertas efímeras (toast global)
    ├── shared/ui/ToastAlert.tsx             # Alerta animada presentacional (sin IPC)
    └── features/auth/
        ├── api/auth.api.ts                  # Wrapper de window.api.auth con fallbacks
        ├── hooks/useAuth.ts                 # Estado de sesión (<= 200 líneas)
        ├── components/                      # AuthHeader, AuthFooter, LoginForm, QuickPinModal, OTP...
        │   └── OperatorSwitchModal.tsx      # Candado LOCK del header: PIN real + cambio de operador
        └── LoginView.tsx                    # Orquestador del flujo de pantallas Auth
```

---

## 4. Catálogo de Endpoints de Laravel API

| Método | Endpoint | Descripción | Payload Enviado |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Login con credenciales principales (**solo bootstrap**) | `{ email, password, station, device_name }` |
| `POST` | `/api/v1/auth/pin-login` | Login rápido de cajero (solo si el PIN no existe local) | `{ pin, station, device_name }` |
| `POST` | `/api/v1/auth/logout` | Revocación de Bearer Token (Sanctum) | Header `Authorization: Bearer <token>` |
| `GET` | `/api/v1/auth/me` | Obtiene el perfil y licencia del usuario | Header `Authorization: Bearer <token>` |
| `POST` | `/api/v1/auth/forgot-password` | Envía código OTP de 6 dígitos por email | `{ email }` |
| `POST` | `/api/v1/auth/verify-otp` | Valida el código OTP ingresado | `{ email, code }` |
| `POST` | `/api/v1/auth/reset-password` | Actualiza la contraseña en la base central | `{ email, code, password, password_confirmation }` |
| `GET` | `/api/v1/license/validate` | Valida vigencia de suscripción comercial | Header `Authorization: Bearer <token>` |

### Estructura de Respuesta Esperada de Laravel (Sanctum)

```json
{
  "status": "success",
  "data": {
    "token": "1|qX8yZ...sanctum_token",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "Carlos Morales",
      "email": "cajero.central@nexuspos.pe",
      "username": "cajero.central",
      "role": "CASHIER",
      "branch": "Sucursal Principal",
      "station": "CAJA-01",
      "active": true
    }
  }
}
```

> Cualquier usuario que se autentique por primera vez contra Laravel se materializa localmente como **`ADMIN`** (es el dueño de la instalación y quien administra usuarios desde Ajustes).

---

## 5. Configuración de la API

```env
# En nexus-post/.env (o variable de entorno del sistema):
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXUS_API_URL=http://127.0.0.1:8000/api/v1
```

O con host virtual de Laragon / Valet:
```env
VITE_API_BASE_URL=http://nexuspos-api.test/api/v1
```

`API_CONFIG.baseUrl` prioriza `NEXUS_API_URL` y cae a `VITE_API_BASE_URL`; el adaptador detecta la URL activa automáticamente.

---

## 6. Modo Fallback / Desarrollo (Offline)

- Si Laravel no está corriendo y el identificador **tampoco** existe localmente, el login devuelve un error de conexión claro (no hay bypass silencioso).
- Credenciales de demostración sembradas en SQLite:
  - **Admin:** `admin@nexuspos.pe` / `Admin#2026` / PIN `9999`
  - **Cajero:** `cajero.central@nexuspos.pe` / `SecurityKey#2026` / PIN `1234`
  - **Código OTP Demo:** `849215`
- Esto permite desarrollar y operar el escritorio sin la API levantada.

---

## 7. Tareas Pendientes / Deuda Técnica

- ⚠️ **Hash de contraseñas:** `users.password_hash` guarda texto plano; migrar a `scrypt`/`argon2`.
- ⚠️ **Tokens persistentes:** el Bearer de Laravel vive solo en memoria del proceso `main`; falta almacenamiento seguro (`safeStorage`).
- ⚠️ **Multi-caja LAN:** cuando exista Caja Maestra, la sesión deberá validarse contra el servidor maestro reutilizando estos mismos contratos.

## 8. Estado operativo actual

- El login consulta primero SQLite local; las credenciales se comparan contra el registro local y la sesión queda en memoria en `AuthService`.
- Si no se encuentra el identificador local, el adaptador Laravel puede realizar el bootstrap remoto. El PIN también resuelve primero contra los usuarios locales.
- La gestión de usuarios y la autorización por rol/permisos se documentan junto con Ajustes en [`08-SETTINGS-HARDWARE.md`](./08-SETTINGS-HARDWARE.md).
- El inicio de sesión no requiere red para usuarios ya materializados localmente. Recuperación OTP y bootstrap remoto sí requieren el servicio externo.
- Las limitaciones de almacenamiento de credenciales/token siguen pendientes; la presencia de controles UI no sustituye las guardias de autorización en main.

### 8.1 Candado de estación (LOCK) y cierre de sesión desde el header

- El botón `LOCK` del header abre `OperatorSwitchModal` (`features/auth/components/OperatorSwitchModal.tsx`), que valida el PIN con `auth:loginWithPin` (SQLite local primero) y, si es válido, cambia el operador activo en `AppContent` (`currentUser`), recalculando pestañas por RBAC sin recargar la ventana.
- El botón `Salir` ejecuta `logoutApi()` (marca `sessionAutoRestoreBlocked`), limpia carrito, ventas pausadas y estado de caja, y vuelve a `LoginView`. Durante el proceso el botón se deshabilita y muestra `Saliendo…`.
- El cierre de sesión emite una alerta animada (`shared/hooks/useToast` + `shared/ui/ToastAlert`) que se renderiza incluso sobre la pantalla de login.
- El chip de estación del header muestra el estado real del turno (`TURNO ACTIVO` / `SIN TURNO`) y navega al módulo Caja `[F4]` cuando la sesión tiene permiso.
