---
name: nexuspos-guide
description: Guía completa de arquitectura, patrones de diseño, estructura de carpetas, atajos de teclado y reglas de NexusPOS Desktop (Electron + React 19 + TypeScript + SQLite). Usar SIEMPRE que se cree, modifique o consulte sobre el proyecto NexusPOS.
---

# Skill: Arquitectura y Guía del Proyecto NexusPOS Desktop

## 1. Visión General del Proyecto
**NexusPOS** es un sistema de Punto de Venta (POS), inventario, kardex y control contable empresarial nativo para Windows (estilo **Windows 11 Fluent Design / WinUI 3**).

- **Stack**: Electron + React 19 + TypeScript + Vite (`electron-vite`) + Tailwind CSS + Lucide Icons + SQLite (`better-sqlite3`).
- **Arquitectura**: Arquitectura Hexagonal (Puertos y Adaptadores) en proceso `main`, Feature-Sliced Design en `renderer`, Offline-First, Event-Driven.
- **Diseño Visual**: "Fluent POS Engine" — Fondo `#F3F3F3`, Acento principal `#0067C0`, Cobro/Éxito `#107C41`, Tablas Densas de 40px, fuentes tabulares monospace para montos.

---

## 2. Mapa de Atajos de Teclado (Hotkeys)
- **F1..F7**: Navegación de pestañas (POS, Inventario, Kardex, Caja, Clientes, Reportes, Ajustes).
- **F12**: Modal de Cobro Estándar.
- **ALT + Q**: Cobro Rápido (efectivo exacto).
- **ALT + L**: Selector reactivo de productos.
- **ALT + P**: Pausar / Suspender venta actual.
- **ALT + E / S**: Entradas y Salidas masivas (ajuste de stock).
- **ALT + B**: Generador de etiquetas e impresión de códigos de barras (EAN-13, Code128).
- **ALT + N**: Registrar Nuevo Producto.
- **ALT + G**: Registrar Gasto Manual en caja.
- **ALT + C**: Registrar Nuevo Cliente.
- **ALT + U**: Matriz RBAC de permisos.
- **Esc**: Cancelar o cerrar modales.
- **Enter**: Confirmar formularios / escáner de código de barras.

---

## 3. Estructura Canónica del Proyecto

```text
src/
├── main/                                    # Proceso Node/Electron (Hexagonal + DDD)
│   ├── index.ts                             # Bootstrap de Electron
│   ├── ipc/                                 # Canales IPC (1 por dominio)
│   │   ├── index.ts
│   │   ├── sales.ipc.ts
│   │   └── products.ipc.ts
│   ├── domain/                              # Lógica pura (sin Electron, sin SQLite)
│   │   ├── sales/ (sale.entity.ts, sale.service.ts, sale.errors.ts)
│   │   ├── inventory/
│   │   └── shared/ (money.ts, result.ts)
│   ├── ports/                               # Interfaces de repositorios y hardware
│   └── adapters/                            # Implementaciones SQLite y Hardware (RS-232, ESC/POS)
│       ├── persistence/sqlite/
│       └── hardware/
│
├── preload/
│   └── index.ts                             # contextBridge tipado (window.api.*)
│
└── renderer/src/                            # Frontend React 19
    ├── app/                                 # Shell, Router (tabs.config), Providers
    ├── features/                            # Feature-Sliced Modules
    │   ├── pos/                             # POSView, components, hooks, api, types
    │   ├── inventory/                       # ProductTable, Modales de Stock, Barcode
    │   ├── kardex/                          # KardexView (Auditoría inmutable)
    │   ├── cash-shift/                      # CashShiftView (Arqueo Z, Gaveta)
    │   ├── customers/                       # CustomersView (Cuentas por cobrar, Abonos)
    │   ├── reports/                         # ReportsView (KPIs, Gráficos SVG)
    │   └── settings/                        # SettingsGrid (RBAC, Impresora, Báscula)
    └── shared/                              # UI Reutilizable, Hooks, Lib, Types
        ├── ui/                              # Button, Modal, DataTable, MoneyInput
        ├── lib/                             # money.ts, iva.ts, result.ts
        └── types/                           # domain.ts
```

---

## 4. Reglas de Arquitectura e Importación

1. **Aislamiento entre Features**: `features/A` NUNCA importa de `features/B`. Todo lo compartido sube a `shared/`.
2. **Componentes Shared Puros**: `shared/ui` no contiene llamadas a IPC ni lógica de negocio.
3. **Lógica de Dominio Pura**: `main/domain` no importa `electron`, `better-sqlite3` ni adaptadores.
4. **IPC Seguro**: `renderer` interactúa con el proceso main exclusivamente a través de `window.api.*` (preload `contextBridge`).
5. **Límites de Tamaño**: Componentes UI <= 300 líneas. Hooks <= 200 líneas.
6. **Soft Delete**: Los productos eliminados usan borrado lógico (`deleted = true`, `active = false`) para resguardar la trazabilidad histórica de Kardex y tickets.

---

## 5. Módulos y Dominio de Negocio

- **POS (Terminal de Ventas)**: Búsqueda reactiva, carrito con steppers, cobro mixto (efectivo/tarjeta/crédito), suspensión de ventas y tickets térmicos de 80mm.
- **Inventario**: Catálogo denso estilo Excel, alertas de stock mínimo/máximo, entradas/salidas masivas y generador de código de barras para impresoras térmicas (Zebra/Xprinter).
- **Kardex**: Registro inmutable de cada movimiento de stock (+ entradas / - salidas), filtrable por producto, motivo y fechas, exportable a Excel.
- **Caja & Turno**: Arqueo Z, control de saldo inicial, dinero esperado vs dinero físico, registro de gastos y abonos en tiempo real.
- **Clientes & Crédito**: Cartera de clientes a crédito, historial de tickets pendientes y recepción de abonos directos a la gaveta de caja.
- **Ajustes & Hardware**: Matriz RBAC, respaldo/restauración de BD SQLite, conexión RS-232 para básculas de pesaje comercial.
