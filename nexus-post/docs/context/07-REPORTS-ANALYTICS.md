# 📊 MÓDULO 07 — REPORTES, KPIS Y ANALÍTICA

> **Contexto Modular:** Este documento contiene la arquitectura, fórmulas de analítica comercial y componentes de visualización gráfica de NexusPOS Desktop.
> **Contexto Maestro:** Ver [`00-MASTER-CONTEXT.md`](./00-MASTER-CONTEXT.md) para estándares globales.

---

## 1. Responsabilidad del Módulo

Reportes consulta SQLite local mediante el proceso `main`; la UI no usa datos demo ni consulta directamente la base. El tablero incluye:
- **KPIs reales del rango:** ventas netas (facturas emitidas menos devoluciones procesadas), utilidad bruta, margen sobre venta sin impuesto, ticket promedio bruto, cantidad de facturas emitidas y devoluciones procesadas.
- **Comparación de ventas:** crecimiento contra el período de duración equivalente anterior. Si el período anterior no tuvo ventas, el porcentaje no se presenta como crecimiento calculable.
- **Gráfico SVG interactivo:** ventas y utilidad bruta, agrupables por día, semana, mes o año. El tooltip expone ingresos, utilidad y cantidad de facturas.
- **Top 5 de productos:** unidades netas y facturación por líneas de venta, descontando devoluciones en la fecha en que se procesaron. El ingreso por producto no incluye impuestos.
- **Top 5 de clientes:** gasto neto (incluye impuestos) y facturas emitidas asociadas al cliente en el período; cada fila tiene **Ver cliente**, con datos del perfil, crédito, deuda pendiente, deudas y abonos registrados.
- **Impacto comercial:** mejor período en el gráfico, participación del cliente líder, devoluciones procesadas y distribución por medio de pago.
- **Filtros temporales:** hoy, semana actual, mes actual y año seleccionado. El selector de año se alimenta de años con ventas guardadas y siempre ofrece el año actual.
- **Estado y actualización:** el encabezado distingue la tasa BCV de los filtros del reporte; se puede recargar manualmente el tablero y reintentar una consulta fallida. Si la consulta falla antes de tener datos, la pantalla muestra el error en lugar de presentar KPIs en cero como si fueran resultados.
- **Presentación:** encabezado analítico, filtros agrupados, indicadores en tarjetas y estados de carga/error mantienen la jerarquía visual del módulo. El insight de mejor período omite buckets sin actividad para evitar declarar un período de ventas en cero.

Ventas/devoluciones se guardan en USD. Todos los montos monetarios visibles en Reportes muestran debajo su equivalente en bolívares (VES), calculado con la tasa USD/VES consultada al servicio BCV al entrar al módulo. La tasa y su fecha/hora de actualización se muestran en el encabezado; si la tasa es de respaldo/desactualizada o no está disponible, se informa en pantalla y los montos USD continúan visibles. El equivalente VES es informativo, se redondea a dos decimales y no modifica los valores persistidos en USD.

## 2. Fuente y reglas de cálculo

- `sales.total`, `sales.tax`, `sales.sold_at`, líneas históricas `sale_items.line_total` y `unit_cost`; las devoluciones usan `sale_refunds.amount`, `returned_at` y `payment_json`.
- Las facturas se atribuyen al período de emisión; las devoluciones se atribuyen al período en que se procesaron. Ventas netas = facturación emitida menos reembolsos procesados. Las series y los rankings descuentan la devolución en su fecha, sin reescribir los períodos de emisión anteriores.
- Importes de facturas, reembolsos, pagos y utilidad se convierten a centavos por operación antes de agregarse. Utilidad bruta = ventas sin impuesto (`total - tax`) menos costos históricos de las líneas, revertida al procesar devoluciones completas. El margen divide utilidad neta entre venta neta sin impuesto; el impuesto asociado al reembolso se prorratea con la tasa efectiva de la factura original.
- El ticket promedio usa facturación bruta del período dividida entre facturas emitidas; no se reduce si esas facturas se devuelven en otro momento. El conteo de devoluciones e importe reembolsado corresponden a su fecha de procesamiento. Los medios mixtos se separan en componentes de efectivo/tarjeta; crédito se presenta aparte.
- El top de productos presenta ingreso sin impuesto distribuido proporcionalmente entre las líneas de cada factura y unidades netas; el top de clientes presenta gasto neto con impuesto y número de facturas emitidas. La distribución por línea es proporcional porque el detalle histórico no guarda el impuesto por línea. Solo se listan productos/clientes con saldo neto positivo en el período.
- La pantalla de cliente consulta el resumen persistido del módulo Clientes (datos, límite y disponibilidad de crédito, deuda abierta, deudas y pagos). La deuda y los abonos son acumulados de la cuenta actual, no limitados al filtro temporal del ranking.
- No descuenta gastos operativos; ventas antiguas con `unit_cost` inicializado en cero pueden sobreestimar utilidad. La UI presenta esta limitación. El almacenamiento de origen usa `REAL`; los agregados monetarios se normalizan a centavos antes de sumar.
- El acceso se valida en `ReportsService`: ADMIN siempre puede consultar y otros usuarios requieren el permiso modular `reports`.

---

## 3. Mapa de Archivos del Módulo

```text
nexus-post/src/
renderer/src/features/reports/
├── ReportsView.tsx
├── api/reports.api.ts
├── hooks/useReports.ts
└── components/
    ├── ReportsBusinessImpact.tsx
    ├── ReportsKpis.tsx
    ├── ReportsRankings.tsx
    └── SalesTrendChart.tsx

main/
├── domain/reports/reports.service.ts
├── ports/reports.repository.ts
├── adapters/persistence/sqlite/reports.sqlite.ts
└── ipc/reports.ipc.ts
```

---

## 4. Atajos de Teclado del Módulo

| Atajo | Acción |
| :---: | :--- |
| `[F6]` | Cambiar a pestaña **Reportes y Métricas** |

---

## 5. Conexiones con Otros Módulos

- ➡️ **Módulo 01 (Auth / RBAC):** El acceso a la pestaña se controla con el permiso modular `reports` (`canAccessTab`); no existe un permiso de acción `CAN_SEE_REPORTS`.
- ➡️ **Módulo 02 (POS) y 05 (Caja):** Consolida los datos históricos de tickets y turnos para proyectar las tendencias de ingresos.

## 6. Estado de implementación

- **Operativo y conectado a SQLite:** consulta agregada por IPC `reports:getDashboard`; contratos en `src/shared/contracts/reports.contract.ts`.
- El IPC `reports:getCustomerDetail` devuelve el perfil y estado de cuenta real seleccionado desde el ranking; valida la misma sesión y permiso de Reportes.
- Los montos totales del tablero, gráficos (al seleccionar un punto), rankings, medios de pago e información monetaria del detalle de cliente muestran conversión a VES bajo su valor USD usando la tasa actual BCV. El encabezado identifica la fuente, fecha de actualización y si la tasa está desactualizada.
- Los rangos hoy/semana/mes usan el calendario local y llegan hasta hoy; el año muestra el año seleccionado completo, excepto el actual, que es acumulado al día. La comparación usa el día anterior, semana previa equivalente, mes previo hasta el mismo día (ajustado a la duración del mes) o año calendario anterior.
- La agrupación del gráfico se puede cambiar de forma independiente a día/semana/mes/año. Los filtros y rankings cambian al período consultado.
- La acción **Actualizar** vuelve a consultar el filtro activo; ante error, **Reintentar** inicia una nueva consulta. Los cambios de filtro y recargas descartan respuestas de solicitudes previas.
- Las tarjetas KPI solo aparecen con datos válidos o como estado de carga; una consulta fallida sin datos no se representa como un tablero de ceros.
- La utilidad es bruta y depende de los costos capturados en el detalle del ticket; no equivale a ganancia neta contable ni descuenta gastos operativos.
- El impacto comercial presenta observaciones descriptivas de los datos; no predice ventas futuras ni aplica reglas automáticas para regalar/descontar.
