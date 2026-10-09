---
name: nexuspos-architecture
description: Reglas obligatorias de arquitectura, ubicación de archivos y patrones para NexusPOS Desktop. Úsalo SIEMPRE que se cree, mueva o modifique un archivo del proyecto.
---

# Skill: Arquitectura NexusPOS

Eres un arquitecto de software trabajando en NexusPOS Desktop
(Electron + React 19 + TypeScript + Tailwind + SQLite).
Toda decisión de estructura DEBE seguir estas reglas sin excepción.

## 1. Antes de crear cualquier archivo, responde estas preguntas

1. ¿A qué **feature** pertenece? (pos, inventory, kardex, cash-shift, customers, reports, settings, o shared)
2. ¿Es **main** (Node/Electron), **preload** o **renderer**?
3. Si es renderer: ¿es UI reutilizable (**shared/ui**), lógica de negocio de una feature (**features/X**), o infraestructura transversal (**shared/lib, shared/hooks**)?
4. Si es main: ¿es **domain** (puro), **port** (interfaz), **adapter** (implementación) o **ipc** (canal)?

Si no puedes responder las 4 con certeza, DETENTE y pregunta al usuario.

## 2. Ubicación canónica de archivos

| Tipo de archivo | Ruta exacta |
|---|---|
| Componente UI reutilizable (Button, Modal, DataTable) | `renderer/src/shared/ui/<Nombre>.tsx` |
| Hook transversal (useDebounce, useHotkey) | `renderer/src/shared/hooks/use<Nombre>.ts` |
| Utilidad pura (money, iva, result) | `renderer/src/shared/lib/<nombre>.ts` |
| Tipo de dominio compartido main↔renderer | `renderer/src/shared/types/domain.ts` (main importa vía alias) |
| Componente de una feature | `renderer/src/features/<feature>/components/<Nombre>.tsx` |
| Hook de una feature | `renderer/src/features/<feature>/hooks/use<Nombre>.ts` |
| Cliente IPC de una feature | `renderer/src/features/<feature>/api/<feature>.api.ts` |
| Página raíz de una feature | `renderer/src/features/<feature>/<Feature>View.tsx` |
| Entidad de dominio | `main/domain/<dominio>/<entidad>.entity.ts` |
| Servicio de dominio (reglas de negocio) | `main/domain/<dominio>/<entidad>.service.ts` |
| Errores de dominio | `main/domain/<dominio>/<entidad>.errors.ts` |
| Interfaz de repositorio | `main/ports/<entidad>.repository.ts` |
| Implementación SQLite | `main/adapters/persistence/sqlite/<entidad>.sqlite.repo.ts` |
| Implementación hardware | `main/adapters/hardware/<dispositivo>.adapter.ts` |
| Migración SQL | `main/adapters/persistence/sqlite/migrations/NNN_descripcion.sql` |
| Canal IPC | `main/ipc/<dominio>.ipc.ts` |
| Registro IPC raíz | `main/ipc/index.ts` |

## 3. Reglas de dependencia (violarlas = error grave)

- ❌ `features/A` NO puede importar de `features/B`.
  ✅ Si comparten algo, súbelo a `shared/`.
- ❌ `shared/` NO puede importar de `features/`.
- ❌ `shared/ui` NO puede contener lógica de negocio (sin fetch, sin IPC, sin hooks de feature).
- ❌ `main/domain/` NO puede importar `electron`, `better-sqlite3`, ni nada de `adapters/`.
- ❌ `renderer` NO puede importar `better-sqlite3` ni tocar `fs` directamente.
- ❌ Ningún componente puede tener más de **300 líneas**. Si lo supera, divídelo.
- ❌ Ningún hook puede tener más de **200 líneas**.
- ✅ `main/domain/` importa solo de `main/ports/` y `main/domain/shared/`.
- ✅ `main/adapters/` implementa interfaces de `main/ports/`.
- ✅ `main/ipc/` orquesta domain + adapters y expone canales.
- ✅ `renderer` habla con main SOLO vía `window.api.*` (contextBridge).

## 4. Patrones obligatorios

### 4.1 Nueva feature (checklist)

Al agregar una feature nueva (`features/promociones`, por ejemplo):

1. Crear `features/promociones/` con subcarpetas `components/`, `hooks/`, `api/`, `types/`.
2. Crear `features/promociones/PromocionesView.tsx` como raíz.
3. Crear `features/promociones/api/promociones.api.ts` que envuelva `window.api.promociones.*`.
4. En `main/domain/promociones/`: entidad, servicio, errores.
5. En `main/ports/promociones.repository.ts`: interfaz.
6. En `main/adapters/persistence/sqlite/promociones.sqlite.repo.ts`: implementación.
7. En `main/ipc/promociones.ipc.ts`: registrar canales `promociones:*`.
8. En `main/ipc/index.ts`: importar y llamar `registerPromocionesIpc()`.
9. En `preload/index.ts`: exponer `promociones` en el contextBridge.
10. En `app/router/tabs.config.tsx`: agregar a la navegación (con F-key si aplica).
11. Migración SQL en `migrations/NNN_promociones.sql`.

### 4.2 Nuevo canal IPC

```ts
// main/ipc/sales.ipc.ts
import { ipcMain } from 'electron';
import { SaleService } from '../domain/sales/sale.service';
import { SqliteSaleRepository } from '../adapters/persistence/sqlite/sale.sqlite.repo';

const service = new SaleService(new SqliteSaleRepository());

export function registerSalesIpc() {
  ipcMain.handle('sales:create', async (_e, payload) => {
    const result = await service.create(payload);
    return result; // siempre Result<T, DomainError>
  });
}
```

## 5. Estructura de Carpetas de Referencia

```text
src/
├── main/                                    # Proceso Electron (Hexagonal)
│   ├── index.ts                             # Bootstrap
│   ├── ipc/                                 # Registro de canales IPC
│   │   ├── index.ts
│   │   ├── sales.ipc.ts
│   │   ├── products.ipc.ts
│   │   └── ...                              # 1 archivo por dominio
│   ├── domain/                              # Lógica pura (sin Electron, sin SQLite)
│   │   ├── sales/
│   │   │   ├── sale.entity.ts
│   │   │   ├── sale.service.ts              # Reglas: stock, descuentos, IVA
│   │   │   └── sale.errors.ts
│   │   ├── inventory/
│   │   ├── cash/
│   │   └── shared/                          # Money, Result<T,E>, Clock
│   ├── ports/                               # Interfaces (contratos)
│   │   ├── sale.repository.ts
│   │   ├── product.repository.ts
│   │   └── kardex.repository.ts
│   └── adapters/                            # Implementaciones concretas
│       ├── persistence/
│       │   ├── sqlite/
│       │   │   ├── db.ts                    # better-sqlite3 singleton
│       │   │   ├── migrations/
│       │   │   │   ├── 001_init.sql
│       │   │   │   └── 002_add_credit.sql
│       │   │   ├── sale.sqlite.repo.ts
│       │   │   ├── product.sqlite.repo.ts
│       │   │   └── kardex.sqlite.repo.ts
│       ├── hardware/
│       │   ├── printer.adapter.ts           # ESC/POS
│       │   ├── scale.adapter.ts             # serialport RS-232
│       │   └── barcode.adapter.ts
│       └── backup/
│           └── backup.adapter.ts
│
├── preload/
│   └── index.ts                             # contextBridge tipado
│
└── renderer/
    └── src/
        ├── app/                             # Shell de la app
        │   ├── App.tsx                       # Solo routing + providers
        │   ├── providers/
        │   │   ├── QueryProvider.tsx         # TanStack Query
        │   │   ├── HotkeysProvider.tsx       # F1-F12 global
        │   │   └── ThemeProvider.tsx
        │   └── router/
        │       └── tabs.config.tsx           # F1..F7 → componente
        │
        ├── features/                         # ⭐ EL CORAZÓN
        │   ├── pos/
        │   │   ├── components/               # UI específica de POS
        │   │   │   ├── CartTable.tsx
        │   │   │   ├── PaymentPanel.tsx
        │   │   │   ├── SplitPaymentModal.tsx
        │   │   │   └── SuspendedSalesModal.tsx
        │   │   ├── hooks/
        │   │   │   ├── useCart.ts            # Zustand store
        │   │   │   ├── useCheckout.ts        # Orquesta IPC + invalidaciones
        │   │   │   └── useSuspendedSales.ts
        │   │   ├── api/
        │   │   │   └── pos.api.ts            # Envuelve window.api.sales.*
        │   │   ├── types/
        │   │   │   └── cart.types.ts
        │   │   └── POSView.tsx               # Página raíz de la feature
        │   ├── inventory/
        │   │   ├── components/
        │   │   ├── hooks/
        │   │   ├── api/
        │   │   └── InventoryView.tsx
        │   ├── kardex/
        │   ├── cash-shift/
        │   ├── customers/
        │   ├── reports/
        │   └── settings/
        │
        ├── shared/                           # Transversal, SIN lógica de negocio
        │   ├── ui/                           # Design System Fluent POS
        │   │   ├── Button.tsx
        │   │   ├── Modal.tsx
        │   │   ├── DataTable.tsx             # Tabla densa 40px reutilizable
        │   │   ├── StatusBadge.tsx
        │   │   └── MoneyInput.tsx
        │   ├── icons/
        │   │   └── index.ts                  # Re-export Lucide tipado
        │   ├── hooks/
        │   │   ├── useHotkey.ts
        │   │   └── useDebounce.ts
        │   ├── lib/
        │   │   ├── money.ts                  # Formato, redondeo
        │   │   ├── iva.ts
        │   │   └── result.ts
        │   └── types/
        │       └── domain.ts                 # Product, Sale, Customer...
        │
        └── styles/
            └── main.css                      # Tailwind + tokens WinUI
```