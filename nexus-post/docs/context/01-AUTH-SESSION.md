# 🔐 MÓDULO 01 — AUTH & SESSION MANAGEMENT

> **Contexto Modular:** Este documento contiene la arquitectura, contratos, estado actual y reglas de desarrollo del módulo de Autenticación, Sesión y Seguridad de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

Este módulo gestiona la barrera de acceso a NexusPOS:
- Inicio de sesión por credenciales corporativas (email + contraseña).
- Identificación ultrarrápida de cajeros mediante PIN numérico de 4 dígitos (`[F10]`).
- Soporte para autenticación por credencial de proximidad RFID / NFC (USB).
- Recuperación de cuenta empresarial en dos fases (solicitud de email corporativo y canvas split WinUI 3 para verificación OTP de 6 dígitos + definición de nueva clave con políticas Active Directory).
- Mantenimiento de la sesión del operador en curso en `DashboardLayout` y desconexión segura (`logout`).

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/auth/
│   │   ├── auth.service.ts                  # Lógica de dominio (login, hashing, tokens OTP)
│   │   └── user.entity.ts                   # Entidad User y roles
│   ├── ports/
│   │   └── user.repository.ts               # Puerto UserRepository
│   ├── adapters/persistence/sqlite/
│   │   ├── users.sqlite.ts                  # Adaptador SQLite con queries preparadas
│   │   └── migrations/004_users.ts          # Tabla 'users' con cajero inicial sembrado
│   └── ipc/
│       └── auth.ipc.ts                      # Handlers de ipcMain ('auth:*')
│
├── preload/
│   └── index.ts                             # Expone api.auth.* al renderer
│
├── shared/contracts/
│   ├── auth.contract.ts                     # Interfaces: User, LoginInput, PinLoginInput, etc.
│   └── api.contract.ts                      # Canales IPC_CHANNELS.auth
│
└── renderer/src/features/auth/
    ├── api/
    │   └── auth.api.ts                      # Wrapper de window.api.auth con fallbacks
    ├── hooks/
    │   └── useAuth.ts                       # Custom Hook de estado de autenticación (<= 200 lín.)
    ├── components/
    │   ├── AuthHeader.tsx                   # Barra de título WinUI 3 y botones ventana
    │   ├── AuthFooter.tsx                   # Barra inferior con estado de terminal
    │   ├── LoginForm.tsx                    # Formulario de login (sin selector de sucursal)
    │   ├── QuickPinModal.tsx                # Modal F10 con teclado numérico y 4 dots
    │   ├── ForgotPasswordView.tsx           # Pantalla completa Stitch (ingreso de email)
    │   └── VerifyCodeResetPasswordView.tsx  # Pantalla split Stitch (OTP 5 col + Reset 6 col)
    └── LoginView.tsx                        # Orquestador del flujo de pantallas Auth
```

---

## 3. Contratos e Interfaces Clave (`@shared/contracts`)

```typescript
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'cashier'
  pin?: string
  active: boolean
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}
```

Canales IPC registrados (`IPC_CHANNELS.auth`):
- `auth:login`: Login con email y password.
- `auth:login-pin`: Login rápido con PIN de 4 dígitos.
- `auth:logout`: Cierre de sesión y limpieza de estado.
- `auth:get-current-user`: Obtiene usuario con sesión activa en el arranque.
- `auth:send-otp`: Emite código numérico temporal de 6 dígitos.
- `auth:verify-otp`: Valida el código OTP de 6 dígitos.
- `auth:reset-password`: Actualiza la contraseña en la base de datos local SQLite.

---

## 4. Estado Actual de Implementación

- ✅ **LoginView Inicial:** La aplicación arranca en `LoginView` si no hay sesión (`App.tsx`).
- ✅ **Sin selector de sucursal en Login:** La sucursal no se selecciona en el login (las sucursales pertenecen a la cuenta autenticada y se administran internamente).
- ✅ **Diseño Stitch 1:1:**
  - `ForgotPasswordView`: Pantalla completa acrílica WinUI 3 con ícono de cifrado, input RFC 5322 con barra inferior activa y tarjeta de seguridad RSA-4096.
  - `VerifyCodeResetPasswordView`: Canvas ancho de 2 columnas (`max-w-5xl`). Columna izquierda (5 cols) con cajas de 6 dígitos OTP y timer; Columna derecha (6 cols) con medidor de fuerza de 4 barras WinUI 3, 4 chips de política de seguridad y confirmación de contraseña (desbloqueada únicamente tras validar el OTP).
- ✅ **Credenciales por Defecto (Seed SQLite):**
  - Email: `cajero.central@nexuspos.pe`
  - Contraseña: `SecurityKey#2026`
  - PIN: `1234`
  - Código demo OTP: `849215`
- ✅ **Cierre de sesión resiliente (botón `Salir`):**
  - `DashboardLayout` dispara `handleLogout` en `App.tsx`, que ejecuta `logoutApi()` (canal `auth:logout`) y luego limpia `cart` y `currentUser`.
  - `logoutApi()` nunca lanza excepción: si el canal IPC o SQLite aún no está disponible, la sesión local del renderer se cierra de todas formas (los flujos UI no dependen de la BD).
  - Flag `sessionAutoRestoreBlocked` (en `features/auth/api/auth.api.ts`): tras un logout explícito, `useAuth` no restaura la sesión de `auth:get-current-user` al montar `LoginView`, evitando el rebote inmediato al dashboard. Se rehabilita al autenticarse de nuevo (login, PIN u OTP).

---

## 5. Conexiones con Otros Módulos

- ➡️ **Módulo 02 (POS):** Al loguearse exitosamente, el objeto `User` se inyecta en el estado global para registrar las ventas a nombre del cajero (`sale.cashierId`).
- ➡️ **Módulo 05 (Caja y Turnos):** El usuario en sesión determina la apertura de caja y el cajero responsable del Arqueo Z.
- ➡️ **Módulo 08 (Ajustes & RBAC):** El rol (`admin`, `supervisor`, `cashier`) condiciona los permisos de anulación, descuentos manuales y reportes financieros.

---

## 6. Reglas Específicas del Módulo

1. **Aislamiento de Componentes:** Cada vista de pantalla (`ForgotPasswordView`, `VerifyCodeResetPasswordView`) es autocontenida.
2. **Tamaño de Archivos:** `useAuth.ts` debe mantenerse bajo **200 líneas**. `LoginView.tsx` y subcomponentes bajo **300 líneas**.
3. **Manejo de Errores Amigable:** Los fallos de autenticación muestran toasts acrílicos con íconos Fluent y feedback sonoro o visual.
