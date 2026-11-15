# 🔐 MÓDULO 01 — AUTH & SESSION MANAGEMENT (LARAVEL API READY)

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, integración con la API de Laravel y reglas del módulo de Autenticación, Sesión y Seguridad de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad y Modelo de Negocio

El acceso a NexusPOS Desktop opera bajo un modelo de suscripción y cuentas centralizadas:
1. **Registro en Landing Page Web:** El usuario/comercio se registra y adquiere su suscripción en la Landing Page (React Web + Laravel API).
2. **Descarga del Instalador Desktop:** Una vez creada la cuenta en la plataforma, descarga el sistema POS de escritorio.
3. **Validación de Credenciales:** La aplicación de escritorio valida el correo y la contraseña directamente contra la API de Laravel (`POST /api/v1/auth/login`).
4. **Resiliencia Offline-First:** Si el servidor de Laravel no está disponible (modo offline o mientras el backend esté en desarrollo), el sistema permite un fallback transparente a SQLite local para no detener la operación.

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/auth/
│   │   ├── auth.service.ts                  # Lógica de dominio híbrida (Laravel API + fallback SQLite)
│   │   └── user.entity.ts                   # Entidad User y roles
│   ├── ports/
│   │   ├── user.repository.ts               # Puerto UserRepository (SQLite local)
│   │   └── remote-auth.port.ts              # Puerto RemoteAuthPort (API Laravel)
│   ├── adapters/
│   │   ├── remote/
│   │   │   └── laravel-auth.adapter.ts      # Cliente HTTP nativo contra endpoints de Laravel
│   │   └── persistence/sqlite/
│   │       ├── users.sqlite.ts              # Adaptador SQLite con queries preparadas
│   │       └── migrations/004_users.ts      # Tabla 'users' con cajero inicial sembrado
│   └── ipc/
│       ├── auth.ipc.ts                      # Handlers de ipcMain ('auth:*')
│       └── index.ts                         # Inyección de dependencias (LaravelAuthAdapter + SQLite)
│
├── preload/
│   └── index.ts                             # Expone api.auth.* al renderer
│
├── shared/
│   ├── config/
│   │   └── api.config.ts                    # Configuración centralizada de URLs y endpoints de Laravel
│   └── contracts/
│       ├── auth.contract.ts                 # Interfaces: User, LoginInput, PinLoginInput, etc.
│       └── api.contract.ts                  # Canales IPC_CHANNELS.auth
│
└── renderer/src/features/auth/
    ├── api/
    │   └── auth.api.ts                      # Wrapper de window.api.auth con fallbacks
    ├── hooks/
    │   └── useAuth.ts                       # Custom Hook de estado de autenticación (<= 200 lín.)
    ├── components/
    │   ├── AuthHeader.tsx                   # Barra de título WinUI 3 y controles de ventana
    │   ├── AuthFooter.tsx                   # Barra inferior con estado de terminal
    │   ├── LoginForm.tsx                    # Formulario de login (sin selector de sucursal)
    │   ├── QuickPinModal.tsx                # Modal F10 con teclado numérico y 4 dots
    │   ├── ForgotPasswordView.tsx           # Pantalla completa Stitch (ingreso de email)
    │   └── VerifyCodeResetPasswordView.tsx  # Pantalla split Stitch (OTP 5 col + Reset 6 col)
    └── LoginView.tsx                        # Orquestador del flujo de pantallas Auth
```

---

## 3. Catálogo de Endpoints de Laravel API (Ya Conectados)

La aplicación de escritorio ya tiene programados y conectados los siguientes endpoints en `src/main/adapters/remote/laravel-auth.adapter.ts` y `src/shared/config/api.config.ts`:

| Método | Endpoint | Descripción | Payload Enviado |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Login con credenciales principales | `{ email, password, station, device_name }` |
| `POST` | `/api/v1/auth/pin-login` | Login rápido de cajero en terminal | `{ pin, station, device_name }` |
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

---

## 4. Cómo Conectar la API Cuando Esté Lista

Cuando el backend de **Laravel** esté desarrollado y corriendo, solo debes configurar la URL base en el archivo `.env` o en `src/shared/config/api.config.ts`:

```env
# En nexus-post/.env (o variable de entorno del sistema):
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXUS_API_URL=http://127.0.0.1:8000/api/v1
```

O si utilizas un host virtual de Laragon / Valet:
```env
VITE_API_BASE_URL=http://nexuspos-api.test/api/v1
```

El adaptador detectará automáticamente la URL activa y autenticará contra Laravel.

---

## 5. Modo Fallback / Desarrollo (Offline)

Mientras la API de Laravel no esté corriendo:
- Si la conexión falla (`ECONNREFUSED` / timeout), el sistema pasa automáticamente al modo local en SQLite.
- Permite usar las credenciales de demostración sembradas:
  - **Email:** `cajero.central@nexuspos.pe`
  - **Contraseña:** `SecurityKey#2026`
  - **PIN:** `1234`
  - **Código OTP Demo:** `849215`
- Esto garantiza que puedes continuar desarrollando el frontend de escritorio sin depender de que la API esté levantada.
