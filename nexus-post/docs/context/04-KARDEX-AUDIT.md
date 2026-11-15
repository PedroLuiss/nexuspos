# 📜 MÓDULO 04 — KARDEX Y AUDITORÍA INMUTABLE

> **Contexto Modular:** Este documento contiene la arquitectura, modelo de datos y reglas de auditoría inmutable de inventarios de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Kardex constituye el libro mayor inmutable de movimientos físicos y contables de stock:
- **Trazabilidad Completa:** Cada incremento o decremento de stock queda grabado permanentemente con fecha/hora exacta, usuario responsable, stock previo, cantidad movida y stock resultante.
- **Tipos de Movimiento:**
  - `ENTRADA (+)`: Compras a proveedores, inventario inicial, recepciones entre sucursales, devoluciones de clientes.
  - `SALIDA (-)`: Ventas en caja, mermas, roturas, productos caducados, envíos a otras sucursales.
- **Filtrado Avanzado:** Búsqueda reactiva por nombre de producto, SKU o usuario responsable; filtros por tipo (`ENTRADA`/`SALIDA`) y motivo específico.
- **Exportación Contable:** Capacidad de exportar la sábana de auditoría a hojas de cálculo (`.xlsx`).

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/inventory/                    # KardexMovement entity, reglas de auditoría
│   ├── ports/inventory.repository.ts        # Puerto de persistencia de movimientos
│   ├── adapters/persistence/sqlite/
│   │   ├── movements.sqlite.ts              # Inserción de movimientos inmutables (APPEND-ONLY)
│   │   └── migrations/                      # Tabla 'inventory_movements'
│   └── ipc/inventory.ipc.ts                 # Handler 'inventory:list-movements'
│
├── shared/contracts/
│   └── products.contract.ts                 # Interfaces KardexMovement, KardexReason, etc.
│
└── renderer/src/features/kardex/
    └── KardexView.tsx                       # Vista principal con tabla densa y KPI summary
```

---

## 3. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F3]` | Cambiar a pestaña **Kardex (Auditoría Inmutable)** |
| `[F4]` | (En Stitch alternativo) Acceso a trazabilidad inmutable |

---

## 4. Reglas Críticas de Integridad

1. **Inmutabilidad Absoluta (Append-Only):** La tabla de movimientos de Kardex **NUNCA** permite operaciones de `UPDATE` ni `DELETE`. Todo registro es un hecho histórico inalterable. Si hubo un error en un movimiento, se compensa con un nuevo registro de sentido inverso y motivo de ajuste.
2. **Registro Obligatorio en Cada Transacción:** Ningún módulo puede alterar el campo `stock` de `products` sin registrar el evento correspondiente en `inventory_movements`.
3. **Mantenimiento del Límite de Líneas:** Si `KardexView.tsx` supera las **300 líneas** al añadir exportación Excel o filtros de fechas, se debe dividir en `KardexTable.tsx` y `KardexToolbar.tsx`.
