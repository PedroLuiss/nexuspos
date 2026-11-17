# 📊 MÓDULO 07 — REPORTES, KPIS Y ANALÍTICA

> **Contexto Modular:** Este documento contiene la arquitectura, fórmulas de analítica comercial y componentes de visualización gráfica de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

El módulo de Reportes presenta una maqueta visual de indicadores para el futuro panel gerencial. Las cifras actuales son datos estáticos de muestra y no representan el desempeño real del negocio:
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
renderer/src/features/reports/
└── ReportsView.tsx                          # Vista única con datos mock locales
```

---

## 3. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F6]` | Cambiar a pestaña **Reportes y Métricas** |

---

## 4. Conexiones con Otros Módulos

- ➡️ **Módulo 01 (Auth / RBAC):** El acceso a la pestaña se controla con el permiso modular `reports` (`canAccessTab`); no existe un permiso de acción `CAN_SEE_REPORTS`.
- ➡️ **Módulo 02 (POS) y 05 (Caja):** Consolida los datos históricos de tickets y turnos para proyectar las tendencias de ingresos.

## 5. Estado de implementación

- **Aún es una vista de demostración.** `ReportsView.tsx` contiene constantes locales (`DEFAULT_KPIS`, `MOCK_CHART_DATA` y `TOP_PRODUCTS`); los botones de rango temporal solo cambian la selección visual y no consultan períodos distintos.
- En el proceso `main` no hay actualmente dominio, puerto, repositorio SQLite, contrato ni handler IPC de reportes. No utilizar estas cifras para operación contable o decisiones de negocio.
- POS y Caja ya persisten ventas, costos históricos por línea, pagos y turnos, por lo que existe una fuente local para implementar reportes reales posteriormente; falta construir las consultas agregadas, contratos y filtros.
- Hasta que se conecte la fuente real, los KPIs, el gráfico y el ranking deben etiquetarse como datos de muestra y no presentarse como métricas reales.
