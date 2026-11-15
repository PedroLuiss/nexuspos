# Rules for NexusPOS Desktop

## Contexto del Proyecto
NexusPOS es un sistema de Punto de Venta (POS), inventario, auditoría kardex y administración comercial nativo para Windows (Windows 11 Fluent Design / WinUI 3 visual engine).

- **Stack**: Electron + React 19 + TypeScript + Tailwind CSS + Vite (`electron-vite`) + SQLite (`better-sqlite3`).
- **Procesos**:
  - `main/`: Hexagonal Architecture & Domain-Driven Design (Domain, Ports, Adapters, IPC handlers).
  - `preload/`: `contextBridge` seguro exponiendo `window.api.*`.
  - `renderer/src/`: Feature-Sliced Design (`features/pos`, `inventory`, `kardex`, `cash-shift`, `customers`, `reports`, `settings`, y `shared/`).

---

## 📚 Matriz de Contextos Modulares (Ahorro de Tokens)

Para optimizar el uso de tokens y permitir que cualquier IA comprenda el proyecto sin saturar el contexto, la documentación técnica está fragmentada por módulos en `docs/context/`.

> **Directiva Obligatoria para IAs:** Antes de trabajar, lee el contexto maestro y **ÚNICAMENTE** el contexto del módulo que vas a modificar.

1. **[00-MASTER-CONTEXT.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/00-MASTER-CONTEXT.md)**: Estándares de arquitectura global, reglas de código, layout WinUI 3 y mapa del proyecto.
2. **[01-AUTH-SESSION.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/01-AUTH-SESSION.md)**: Autenticación, PIN [F10], recuperación OTP + nueva clave y control de sesión.
3. **[02-POS-SALES.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/02-POS-SALES.md)**: Terminal de ventas [F1], carrito reactivo, cobro normal [F12], cobro rápido [ALT+Q] y tickets 80mm.
4. **[03-INVENTORY-PRODUCTS.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/03-INVENTORY-PRODUCTS.md)**: Catálogo denso [F2], nuevo producto [ALT+N], ajustes masivos [ALT+E/S] y código de barras [ALT+B].
5. **[04-KARDEX-AUDIT.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/04-KARDEX-AUDIT.md)**: Auditoría inmutable [F3], trazabilidad histórica de entradas/salidas y exportación.
6. **[05-CASH-SHIFT.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/05-CASH-SHIFT.md)**: Corte de turno [F4], Arqueo Z [ALT+K], balance esperado vs contado y gastos [ALT+G].
7. **[06-CUSTOMERS-CREDIT.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/06-CUSTOMERS-CREDIT.md)**: Directorio de clientes [F5], cuentas corrientes, cartera vencida y abonos a caja.
8. **[07-REPORTS-ANALYTICS.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/07-REPORTS-ANALYTICS.md)**: KPIs [F6], gráfico SVG interactivo de ventas y top 5 de productos.
9. **[08-SETTINGS-HARDWARE.md](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/08-SETTINGS-HARDWARE.md)**: Ajustes [F7], báscula RS-232, impresoras térmicas, backup SQLite y matriz RBAC [ALT+U].

> **Protocolo de Actualización:** Por cada cambio significativo realizado en un módulo, se debe actualizar su archivo de contexto respectivo.

---

## Reglas Obligatorias de Código y Arquitectura

1. **Ubicación de Archivos**:
   - Componentes UI compartidos -> `renderer/src/shared/ui/<Componente>.tsx`
   - Hooks transversales -> `renderer/src/shared/hooks/use<Nombre>.ts`
   - Utilidades de cálculo -> `renderer/src/shared/lib/<nombre>.ts`
   - Módulos de feature -> `renderer/src/features/<feature>/...`
   - Entidades y servicios de dominio -> `main/domain/<dominio>/...`
   - Repositorios e interfaces -> `main/ports/...`
   - Adaptadores SQLite/Hardware -> `main/adapters/...`
   - Registros IPC -> `main/ipc/<dominio>.ipc.ts`

2. **Límites de Importación**:
   - ❌ `features/A` NO debe importar de `features/B`. Sube lo compartido a `shared/`.
   - ❌ `shared/ui` NO debe contener IPC ni llamadas a backend/APIs.
   - ❌ `main/domain/` NO debe importar Electron ni SQLite (`better-sqlite3`).

3. **Restricciones de Tamaño de Código**:
   - Los componentes de UI NO deben superar **300 líneas**. Si crecen más, divídelos en subcomponentes.
   - Los custom hooks NO deben superar **200 líneas**.

4. **Integridad de Datos**:
   - Usar siempre **Soft Delete** (`deleted = true`, `active = false`) para productos para preservar el historial de Kardex e informes contables.
