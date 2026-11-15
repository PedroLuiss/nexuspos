# ⚙️ MÓDULO 08 — AJUSTES, HARDWARE Y ADMINISTRACIÓN DE BASE DE DATOS

> **Contexto Modular:** Este documento contiene la arquitectura de periféricos (RS-232, ESC/POS), seguridad granular RBAC y respaldos SQLite de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Ajustes centraliza los parámetros críticos del sistema y la comunicación con periféricos de tienda:
- **Matriz de Permisos y Roles (RBAC):**
  - Configuración de flags de seguridad:
    - `CAN_DELETE_PRODUCT`: Permiso para borrar lógicamente productos.
    - `CAN_SEE_REPORTS`: Visibilidad de márgenes y ventas globales.
    - `CAN_APPLY_DISCOUNT`: Aplicación de rebajas en la línea de cobro.
    - `CAN_MODIFY_PRICE`: Alteración manual de precios en caja.
    - `CAN_MANUAL_CASH_MOVEMENTS`: Registro de entradas/salidas de dinero en caja.
    - `CAN_OVERRIDE_NO_STOCK`: Autorización para vender productos con existencias en cero.
- **Identidad Comercial y Formato de Ticket:**
  - Razón social, RFC / Identificador fiscal, teléfono de tienda, encabezado y pie de página de comprobantes térmicos.
- **Conexión de Báscula por Puerto Serial (RS-232 / COM):**
  - Comunicación con balanzas de peso comercial (Torrey, Rhino, Dibal) mediante lectura de buffer serial.
  - Parámetros: Puerto (`COM1` a `COM4`), velocidad en baudios (9600, 19200 bps), lectura en vivo de peso estabilizado.
- **Configuración de Impresoras Térmicas y Periféricos (`PrinterSettingsModal` / `[ALT + I]`):**
  - Selección de driver ESC/POS, ancho de papel (58mm o 80mm), corte automático y pulso de cajón de dinero.
- **Mantenimiento y Respaldo de Base de Datos SQLite:**
  - Exportación de copias de seguridad locales comprimidas (`.sqlite` / `.sql`) con sello de fecha/hora.
  - Asistente de restauración de base de datos con verificación previa.

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── adapters/hardware/                   # Conectores seriales y sockets térmicos
│   │   ├── scale.serial.ts                  # Protocolo de balanza RS-232
│   │   └── printer.escpos.ts                # Driver de impresión ESC/POS
│   ├── ports/hardware.port.ts               # Interfaces de hardware
│   └── ipc/settings.ipc.ts                  # Handlers 'settings:*', 'hardware:*'
│
├── shared/contracts/
│   └── settings.contract.ts                 # Interfaces BusinessConfig, RbacMatrix, HardwareConfig
│
└── renderer/src/features/settings/
    ├── SettingsGrid.tsx                     # 4 tarjetas principales + modales de configuración
    └── components/ (Sugerido para modularización):
        ├── RbacSettingsModal.tsx            # Modal de matriz RBAC [ALT+U]
        ├── BusinessInfoModal.tsx            # Modal de datos de empresa
        ├── DatabaseBackupModal.tsx          # Modal de respaldo/restauración SQLite
        └── ScaleSettingsModal.tsx           # Modal de calibración de báscula serial
```

---

## 3. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F7]` | Cambiar a pestaña **Ajustes del Sistema** |
| `[ALT + U]` | Modal rápido de **Permisos RBAC** |
| `[ALT + I]` | Modal de **Configuración de Periféricos e Impresoras** |

---

## 4. Tareas Pendientes / Deuda Técnica

- ⚠️ **Refactorización de Líneas:** `SettingsGrid.tsx` supera las 500 líneas. Debe modularizarse extrayendo cada modal en su propio componente para respetar el límite de $\le 300$ líneas.
