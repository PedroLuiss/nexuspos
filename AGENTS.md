# Rules for NexusPOS Desktop

## Contexto del Proyecto
NexusPOS es un sistema de Punto de Venta (POS), inventario, auditoría kardex y administración comercial nativo para Windows (Windows 11 Fluent Design / WinUI 3 visual engine).

- **Stack**: Electron + React 19 + TypeScript + Tailwind CSS + Vite (`electron-vite`) + SQLite (`better-sqlite3`).
- **Procesos**:
  - `main/`: Hexagonal Architecture & Domain-Driven Design (Domain, Ports, Adapters, IPC handlers).
  - `preload/`: `contextBridge` seguro exponiendo `window.api.*`.
  - `renderer/src/`: Feature-Sliced Design (`features/pos`, `inventory`, `kardex`, `cash-shift`, `customers`, `reports`, `settings`, y `shared/`).

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
