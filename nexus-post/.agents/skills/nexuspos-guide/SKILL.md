---
name: nexuspos-guide
description: Guía maestra de ingeniería y navegación modular para NexusPOS Desktop (Electron + React 19 + TypeScript + SQLite). Usar SIEMPRE que cualquier IA o agente interactúe con el proyecto para ahorrar tokens y garantizar la escalabilidad y consistencia del código.
---

# 🤖 NexusPOS Guide: Protocolo de Ingeniería y Navegación Modular para IAs

Esta guía está diseñada para que cualquier agente o Inteligencia Artificial que se conecte a **NexusPOS Desktop** comprenda de inmediato la arquitectura del sistema, aplique los patrones establecidos sin desviarse, ahorre tokens cargando únicamente el contexto relevante y mantenga la documentación sincronizada con cada cambio.

---

## ⚡ Directiva Obligatoria de Ahorro de Tokens

NexusPOS utiliza una **Matriz de Contextos Modulares** ubicada en:
📂 `docs/context/`

> 🛑 **REGLA FUNDAMENTAL PARA IAs:** 
> **NUNCA** cargues todos los archivos de contexto a la vez ni leas todo el código de golpe.
> 1. Lee primero [`00-MASTER-CONTEXT.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/00-MASTER-CONTEXT.md).
> 2. Lee **ÚNICAMENTE** el archivo del módulo específico en el que vas a trabajar.

### Mapa de Enrutamiento de Contextos:

| Si tu tarea trata sobre... | Lee este contexto modular |
| :--- | :--- |
| **Arquitectura global, contratos o reglas inviolables** | [`00-MASTER-CONTEXT.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/00-MASTER-CONTEXT.md) |
| **Login, PIN rápido, OTP, cambio de clave, usuarios** | [`01-AUTH-SESSION.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/01-AUTH-SESSION.md) |
| **Terminal de ventas, carrito, cobro normal/rápido/mixto, tickets 80mm** | [`02-POS-SALES.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/02-POS-SALES.md) |
| **Catálogo, alta de productos, stock, merma/ajuste masivo, códigos de barras** | [`03-INVENTORY-PRODUCTS.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/03-INVENTORY-PRODUCTS.md) |
| **Auditoría inmutable, trazabilidad de entradas/salidas, exportación** | [`04-KARDEX-AUDIT.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/04-KARDEX-AUDIT.md) |
| **Apertura de turno, arqueo Z, balance en gaveta, gastos de caja chica** | [`05-CASH-SHIFT.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/05-CASH-SHIFT.md) |
| **Cartera de clientes, límites de crédito, cuentas por cobrar, abonos a caja** | [`06-CUSTOMERS-CREDIT.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/06-CUSTOMERS-CREDIT.md) |
| **KPIs de venta, ganancias netas, gráficos SVG interactivos, top 5** | [`07-REPORTS-ANALYTICS.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/07-REPORTS-ANALYTICS.md) |
| **Báscula RS-232, impresora térmica ESC/POS, respaldos SQLite, matriz RBAC** | [`08-SETTINGS-HARDWARE.md`](file:///c:/laragon/www/nexuspos/nexus-post/docs/context/08-SETTINGS-HARDWARE.md) |

---

## 🏗️ Patrones de Diseño del Proyecto

### 1. Proceso Main (Backend Node): Arquitectura Hexagonal & DDD
El backend local en `src/main` se estructura estrictamente en:
- **`domain/<dominio>/`**: Lógica de negocio pura (entidades, validaciones, cálculos). **PROHIBIDO** importar `electron` o `better-sqlite3`.
- **`ports/`**: Interfaces TypeScript de contratos de persistencia y hardware (`UserRepository`, `ProductRepository`, etc.).
- **`adapters/persistence/sqlite/`**: Implementación concreta de base de datos con SQLite nativo (`better-sqlite3`).
- **`ipc/`**: Endpoints de comunicación `ipcMain.handle()` tipados.

### 2. Capa Preload: Puente Seguro
- `src/preload/index.ts`: Expone al navegador exclusivamente el objeto `window.api.<dominio>.<metodo>()` usando `contextBridge`. Nunca expone APIs crudas de Node.

### 3. Proceso Renderer (Frontend React 19): Feature-Sliced Design (FSD)
- **`features/<nombre>/`**: Módulos encapsulados (`api/`, `components/`, `hooks/`, `types/`).
- ❌ **Límite inviolable:** `features/pos` **NUNCA** debe importar de `features/inventory`. Si ambos comparten lógica, entidades o componentes, se suben a `src/renderer/src/shared/`.
- **`shared/`**: UI agnóstica (`shared/ui/`), utilidades de cálculo (`shared/lib/`), iconos (`shared/icons/`) y tipos.

---

## 📏 Restricciones Físicas de Código

Toda IA debe verificar antes de entregar cualquier cambio:
1. **Componentes UI:** **Máximo 300 líneas**. Si un componente supera este límite, debe fraccionarse en subcomponentes más pequeños.
2. **Custom Hooks:** **Máximo 200 líneas**. Si un hook crece más, debe separarse la lógica de estado o los efectos secundarios.
3. **Soft Delete Obligatorio:** En `products` y tablas clave, nunca ejecutar `DELETE FROM`. Se marca `deleted = 1` y `active = 0` para resguardar la consistencia de Kardex y tickets.
4. **Cero Errores TypeScript:** Al finalizar, debe verificarse la compilación ejecutando `npx tsc --noEmit`.

---

## 🔄 Protocolo de Actualización de Contextos para IAs

Cuando termines de implementar o modificar una característica:
1. **Actualiza el archivo de contexto modular** correspondiente en `docs/context/` (agrega nuevas props, canales IPC añadidos o marca tareas completadas).
2. De esta forma, la siguiente IA que continúe el trabajo comprenderá el estado exacto sin tener que reescanear todo el código fuente.

### Regla de veracidad del estado modular

- Documenta el comportamiento que existe en el código, no la intención del diseño. Distingue explícitamente entre **persistido/operativo**, **prototipo o datos demo** y **pendiente**.
- Cuando un flujo cruza módulos, actualiza el contexto de cada módulo afectado y describe quién inicia la operación y qué datos se sincronizan. Ejemplo: POS → ventas/stock/Kardex/caja/clientes; devolución → caja/inventario/Kardex/crédito.
- Registra migraciones, contratos IPC relevantes, restricciones de negocio y límites de historial/compatibilidad. No declares una función completa solo porque exista un botón o modal.
- Antes de editar un contexto, lee `00-MASTER-CONTEXT.md` y el contexto modular específico. Al terminar, comprueba que las afirmaciones no contradigan código actual y conserva los pendientes como pendientes.
- El contexto maestro lleva un resumen breve de estado por módulo; el detalle y las limitaciones viven en el archivo numerado de cada módulo.
