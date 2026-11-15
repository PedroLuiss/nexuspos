# 📊 MÓDULO 07 — REPORTES, KPIS Y ANALÍTICA

> **Contexto Modular:** Este documento contiene la arquitectura, fórmulas de analítica comercial y componentes de visualización gráfica de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Reportes proporciona al administrador y gerencia visibilidad en tiempo real del desempeño del negocio:
- **Tarjetas de KPIs Financieros:**
  - *Ventas Totales* (con comparativo porcentual de crecimiento).
  - *Ganancia Neta Real* (deduciendo costo de mercancía y márgenes de impuestos).
  - *Ticket Promedio* ($\text{Ventas Totales} / \text{Transacciones}$).
  - *Volumen de Transacciones*.
- **Gráfico de Línea Interactivo en SVG Nativo:**
  - Curva de ventas e ingresos sin librerías externas pesadas (cero dependencias externas para garantizar máximo rendimiento).
  - Relleno con gradiente acrílico WinUI 3 en `#0078D4`.
  - Puntos interactivos con tooltip dinámico que desglosa ingresos, margen y tickets del día.
- **Ranking Top 5 de Artículos:** Productos con mayor rotación de unidades y facturación monetaria.
- **Filtros Temporales:** Visualización por día actual (`today`), semana en curso (`week`) o mes (`month`).

---

## 2. Mapa de Archivos del Módulo

```text
nexus-post/src/
├── main/
│   ├── domain/reports/                      # Métricas, agregaciones SQL
│   ├── ports/reports.repository.ts          # Puerto de consultas analíticas
│   ├── adapters/persistence/sqlite/
│   │   └── reports.sqlite.ts                # Queries con GROUP BY (días, cajeros, productos)
│   └── ipc/reports.ipc.ts                   # Handlers 'reports:*'
│
├── shared/contracts/
│   └── reports.contract.ts                  # Interfaces ReportKPI, SalesChartPoint, TopProduct
│
└── renderer/src/features/reports/
    ├── ReportsView.tsx                      # Vista analítica completa
    └── components/ (Sugerido para modularización):
        ├── ReportKpiCards.tsx               # 4 tarjetas de indicadores superiores
        ├── SalesLineChart.tsx               # Gráfico SVG nativo con tooltips
        └── TopProductsTable.tsx             # Tabla top 5 de ventas
```

---

## 3. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F6]` | Cambiar a pestaña **Reportes y Métricas** |

---

## 4. Conexiones con Otros Módulos

- ➡️ **Módulo 01 (Auth / RBAC):** Solo usuarios con permiso `CAN_SEE_REPORTS` pueden ver los importes y márgenes.
- ➡️ **Módulo 02 (POS) y 05 (Caja):** Consolida los datos históricos de tickets y turnos para proyectar las tendencias de ingresos.
