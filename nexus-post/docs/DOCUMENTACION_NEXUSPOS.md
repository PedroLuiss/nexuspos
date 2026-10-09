# Documentación Oficial del Sistema NexusPOS Desktop

**Versión:** 2.4.0 (Enterprise Desktop Edition)  
**Arquitectura:** Event-Driven Desktop Application  
**Stack Tecnológico:** Electron + React 19 + TypeScript + Tailwind CSS + Lucide Icons + SQLite (`better-sqlite3`)  
**Estilo Visual:** Windows 11 Fluent Design / WinUI 3 (Design System: "Fluent POS Engine" de Stitch - Fondo `#F3F3F3`, Acento `#0067C0`, Cobro `#107C41`, Tablas Densas 40px, Tipografía Tabular Monospace)

---

## 1. Visión General del Proyecto

**NexusPOS** es un sistema de Punto de Venta (POS), inventario y control contable de grado comercial diseñado para funcionar como una aplicación de escritorio nativa en entornos Windows. Integra una arquitectura **Offline-First**, donde todas las validaciones transaccionales se procesan en el cliente React y se persisten localmente en una base de datos SQLite embebida, garantizando velocidad de milisegundos y operatividad ininterrumpida sin conexión a internet.

---

## 2. Mapa Global de Atajos de Teclado (Hotkeys)

NexusPOS está optimizado para cajeros de alta velocidad mediante teclado y lector de código de barras:

| Atajo | Acción Principal | Contexto / Módulo |
| :--- | :--- | :--- |
| **[F1]** | Cambiar a pestaña **Punto de Venta (POS)** | Navegación Global |
| **[F2]** | Cambiar a pestaña **Inventario & Productos** | Navegación Global |
| **[F3]** | Cambiar a pestaña **Kardex (Auditoría)** | Navegación Global |
| **[F4]** | Cambiar a pestaña **Caja & Corte de Turno** | Navegación Global |
| **[F5]** | Cambiar a pestaña **Clientes & Créditos** | Navegación Global |
| **[F6]** | Cambiar a pestaña **Reportes y Métricas** | Navegación Global |
| **[F7]** | Cambiar a pestaña **Ajustes del Sistema** | Navegación Global |
| **[F12]** | Abrir modal de **Cobro Normal** | Terminal de Ventas (POS) |
| **[ALT + Q]** | **Cobro Rápido** (Efectivo exacto inmediato) | Terminal de Ventas (POS) |
| **[ALT + L]** | **Buscar en Lista** de productos | Terminal de Ventas (POS) |
| **[ALT + P]** | **Pausar Venta** actual a espera | Terminal de Ventas (POS) |
| **[ALT + E]** | **Entradas Masivas** de inventario | Módulo de Productos |
| **[ALT + S]** | **Salidas Masivas** / Mermas de stock | Módulo de Productos |
| **[ALT + B]** | **Generador de Códigos de Barras** | Módulo de Productos |
| **[ALT + N]** | Registrar **Nuevo Producto** | Módulo de Productos |
| **[ALT + G]** | Registrar **Gasto Manual** en caja | Módulo de Caja |
| **[ALT + C]** | Registrar **Nuevo Cliente** | Módulo de Clientes |
| **[ALT + U]** | Gestionar **Permisos RBAC** | Módulo de Ajustes |
| **[Esc]** | Cancelar venta actual / Cerrar modales | Modales y Caja |
| **[Enter]** | Confirmar escaneo de código o formulario | Formularios y Buscador |

---

## 3. Desglose Exhaustivo de Módulos del Sistema

```
                      ┌─────────────────────────────────────────┐
                      │          NEXUSPOS DESKTOP SHELL         │
                      │  WinUI 3 Header + Top Tabs Navigation   │
                      └────────────────────┬────────────────────┘
                                           │
     ┌──────────────┬──────────────┬───────┴──────┬──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼              ▼
1. POS/Ventas  2. Inventario  3. Kardex     4. Caja/Turno  5. Clientes    6. Ajustes
 (Transaccional) (CRUD+Soft)  (Auditoría)   (Arqueo Z)     (Cuentas Cobrar)(RBAC+Serial)
```

---

### Módulo 1: Inventario y Productos (El Backend Local)

Administra el catálogo comercial, control de existencias y emisión de etiquetas térmicas.

- **Tabla Densa Estilo Excel:**
  - Columnas: `Código (SKU)`, `Descripción`, `Costo`, `Venta`, `Categoría`, `Stock`, `Mínimo`, `Estado`.
  - Filas alternas sombreadas con resaltado hover y alertas visuales en rojo/ámbar ante bajo stock o agotamiento.
- **Lógica de Soft Delete (Borrado Lógico):**
  - Los productos eliminados no se destruyen de la base de datos; se marcan con `deleted = true` y `active = false` para preservar la integridad referencial histórica en ventas previas y registros de Kardex.
- **Acciones Rápidas de Ajuste Masivo:**
  - **Entradas Masivas [ALT+E]:** Permite recepcionar mercancía por compras o ajustes sin pasar por venta, actualizando el stock y creando el registro de Kardex de forma automática.
  - **Salidas Masivas [ALT+S]:** Permite dar de baja productos por merma, rotura o caducidad con motivo justificado.
- **Generador de Assets y Códigos de Barras [ALT+B]:**
  - Generador de etiquetas para impresoras térmicas (Zebra, Xprinter).
  - Configuración de simbología (**EAN-13** o **Code128**).
  - Parámetros de impresión: Resolución DPI (203, 300, 600 DPI), dimensiones de etiqueta en milímetros (ancho, alto, márgenes) y número de copias por lote.
- **Modal de Producto en 2 Columnas:**
  - Columna 1: Código de barras con botón de autogeneración, nombre comercial, categoría, unidad de medida (Pza, Kg, Lt, etc.) y descripción.
  - Columna 2: Precio de compra, precio de venta con cálculo en tiempo real de **Margen de Ganancia ($ y %)**, stock inicial, stock mínimo de alerta, stock máximo, casilla de impuesto (IVA 16%) y switch de activación.

---

### Módulo 2: Ventas (POS - El Núcleo Transaccional)

El motor principal de atención al público, diseñado para velocidad extrema y cero fricción.

- **Escaneo y Búsqueda Reactiva:**
  - Campo principal con atajo visible, soporte de lectura por pistola lectora (USB/Bluetooth) con procesamiento en evento `Enter`.
  - Botón **[ALT+L]** para desplegar selector de coincidencias en vivo con stock disponible.
- **Carrito de Compras (Estado Reactivo Global):**
  - Columnas: `Código`, `Descripción`, `Cantidad` (steppers interactivos `+`/`-`), `P.Venta`, `Descuento` (porcentaje configurable por ítem) e `Importe`.
  - **Validación de Stock en Tiempo Real:** Detección de sobreventa; si la cantidad supera las existencias, la fila se resalta en rojo con advertencia inmediata.
- **Panel Inferior de Cobro:**
  - Indicadores en vivo de subtotal, descuentos acumulados, IVA 16% y display gigante de **Total a Pagar** en `#0078D4`.
  - Botón **Cobro Rápido [ALT+Q]:** Procesa la venta de contado exacto en efectivo con 1 solo toque.
  - Botón **Cobro Normal [F12]:** Despliega el modal de cobro completo.
- **Modal de Pagos y División (Mixto):**
  - Métodos soportados: **Efectivo [F6]**, **Tarjeta/Terminal [F7]**, **Mixto [F8]** y **Crédito**.
  - En Efectivo: Botones de denominaciones rápidas ($50, $100, $200, $500, $1000) y cálculo automático de cambio a devolver al cliente.
  - En Pago Mixto: Desglose interactivo con cálculo automático del saldo restante en tarjeta según el efectivo ingresado.
- **Gestión de Ventas en Espera (Pausadas):**
  - Botón **[ALT+P]** para pausar la venta en curso y liberar la caja para atender al siguiente cliente.
  - Modal de ventas en espera con lista de tickets pausados, desglose de artículos y botón para recuperarlos a caja con un clic.
- **Previsualización de Ticket Térmico 80mm:**
  - Template con formato ESC/POS para impresión en impresoras térmicas de 80mm (Epson TM-T20, Bixolon, Star).

---

### Módulo 3: Kardex (Auditoría de Datos Inmutable)

Historial contable inmutable de todos los movimientos de inventario que ocurren en el negocio.

- **Estructura del Rastro Auditado:**
  - `Fecha y Hora`: Estampa de tiempo exacta.
  - `Código & Producto`: Identificador único del artículo.
  - `Tipo`: Indicador visual de **ENTRADA (+)** en verde o **SALIDA (-)** en rojo.
  - `Motivo`: Venta en caja, Entrada masiva, Salida por ajuste, Merma, Devolución o Inventario inicial.
  - `Stock Anterior`, `Cantidad Movida` y `Stock Final`.
  - `Usuario Responsable`: Cajero o administrador que efectuó el movimiento.
- **Filtros Avanzados:**
  - Búsqueda por producto, código o nombre de usuario.
  - Selector de tipo de movimiento (Entradas / Salidas).
  - Selector de motivos específicos.
  - Botón de exportación a archivo Excel (.xlsx).

---

### Módulo 4: Caja y Corte de Turno (Cierre Contable Z)

Supervisión en tiempo real del dinero en efectivo y arqueo al finalizar el turno del cajero.

- **Tarjetas de Rendimiento del Turno:**
  - Ventas Totales del turno (todas las formas de pago).
  - Ganancia Bruta (Sin Impuestos).
  - Ganancia Neta (Con Impuestos / después de deducir IVA).
- **Panel Estructurado: Ecuación de Dinero en Caja:**
  $$\text{Total en Gaveta} = \text{[Inicio]} + \text{[+Abonos]} + \text{[+Entradas]} - \text{[-Salidas]}$$
  - **[Inicio]:** Fondo de caja base registrado en la apertura.
  - **[+Abonos]:** Pagos parciales o totales recibidos de clientes a crédito.
  - **[+Entradas]:** Ingresos extraordinarios de cambio o caja fuerte.
  - **[-Salidas]:** Gastos menores o pagos a proveedores registrados en turno.
  - **[=Total Final]:** Efectivo físico esperado en la gaveta.
- **Corte de Turno (Cierre Z):**
  - Modal de arqueo donde el cajero ingresa el dinero físico contado.
  - Comparativa automatizada con cálculo de **Faltante** (en rojo), **Sobrante** (en azul) o **Cuadre Perfecto** (en verde).
  - Opción de impresión de comprobante Z en papel térmico de 80mm.

---

### Módulo 5: Clientes y Cuentas por Cobrar (Créditos)

Administración de cartera de crédito para clientes de confianza y negocios mayoristas.

- **Listado y Filtros:**
  - Columnas: `Código`, `Nombre`, `RFC/Fiscal`, `Teléfono`, `Límite de Crédito`, `Deuda Actual` y `Estado`.
  - Badges de estado: **DEUDOR** (en rojo con fondo resaltado) o **AL DÍA** (en verde).
  - Chips de filtrado rápido: *Todos*, *Con Deuda*, *Al Día*.
- **Modal de Detalle de Deuda:**
  - Resumen de límite de crédito, deuda acumulada y saldo disponible.
  - Tabla de compras a crédito pendientes con folio de ticket y fecha.
  - Historial de abonos recibidos previamente.
- **Modal de Registro de Abonos:**
  - Registro de pago parcial o liquidación total con un botón.
  - El monto abonado se descuenta automáticamente de la deuda del cliente e **ingresa en tiempo real como dinero en la gaveta de caja**.
- **Registro de Nuevos Clientes [ALT+C]:** Formulario completo con asignación de límite de crédito y datos de facturación.

---

### Módulo 6: Reportes y Métricas Financieras

Panel analítico para gerencia y toma de decisiones.

- **KPIs Principales:**
  - *Ventas Totales* con comparador porcentual semanal.
  - *Ganancia Neta* con margen porcentual de utilidad real.
  - *Ticket Promedio* por venta.
  - *Volumen de Transacciones*.
- **Gráfico Interactivo de Línea (SVG):**
  - Área degradada bajo la curva en color corporativo `#0078D4`.
  - Ejes cartesianos de ingresos y días de la semana.
  - Puntos interactivos con tooltip dinámico que muestra ingresos, margen y número de tickets del día.
- **Tabla de Ranking:** Top 5 de artículos de mayor venta y facturación.

---

### Módulo 7: Ajustes del Sistema y Configuración de Hardware

Panel de control para parámetros globales del software de escritorio.

- **1. Gestión de Permisos (RBAC):**
  - Matriz granular de permisos por rol:
    - `CAN_DELETE_PRODUCT`: Permiso para eliminar productos del inventario.
    - `CAN_SEE_REPORTS`: Visualización de métricas de facturación.
    - `CAN_APPLY_DISCOUNT`: Aplicación de descuentos en línea de caja.
    - `CAN_MODIFY_PRICE`: Modificación de precio de venta manual.
    - `CAN_MANUAL_CASH_MOVEMENTS`: Registro de gastos manuales en caja.
    - `CAN_OVERRIDE_NO_STOCK`: Venta permitida en caso de stock cero.
- **2. Datos de Negocio & Formato de Ticket:**
  - Razón social, RFC, teléfono comercial, encabezado de bienvenida y pie de página de ticket.
- **3. Gestión de Base de Datos (SQLite):**
  - Generación de respaldo local comprimido (`.sqlite` / `.sql`) con nombre fechado.
  - Asistente de restauración de base de datos previa con confirmación de reinicio.
- **4. Conexión de Báscula por Puerto Serial (RS-232 / COM):**
  - Configuración de enlace para básculas de pesaje comercial (Torrey, Rhino, Dibal) mediante librería `serialport` de Node.js.
  - Selector de puerto (`COM1`, `COM2`, `COM3`, `COM4`), velocidad en baudios (9600, 19200 bps) y pantalla digital para prueba de pesaje en vivo con lectura estabilizada.

---

## 4. Estructura de Archivos del Proyecto

```
nexuspos/
├── package.json
└── nexus-post/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.web.json
    ├── tsconfig.node.json
    └── src/
        ├── main/
        │   └── index.ts                 # Proceso principal Electron
        ├── preload/
        │   └── index.ts                 # IPC Preload script
        └── renderer/
            ├── index.html               # Entry HTML
            └── src/
                ├── App.tsx              # Estado global y orquestación
                ├── assets/
                │   └── main.css         # Directivas Tailwind y estilos WinUI
                ├── types/
                │   └── pos.ts           # Interfaces TypeScript completas
                └── components/
                    ├── DashboardLayout.tsx      # Shell Windows 11 + Status bar
                    ├── NavigationTabs.tsx       # Top Tabs Bar con atajos F1-F7
                    ├── POSView.tsx              # Terminal de ventas + panel inferior
                    ├── ProductTable.tsx         # Catálogo denso + acciones masivas
                    ├── AddProductModal.tsx      # Formulario de producto 2 columnas
                    ├── BarcodeGeneratorModal.tsx# Generador de etiquetas DPI/mm
                    ├── StockAdjustmentModal.tsx # Entradas y salidas masivas
                    ├── SuspendedSalesModal.tsx  # Modal de tickets en espera
                    ├── SplitPaymentModal.tsx    # Modal de pago mixto
                    ├── SaleModal.tsx            # Modal de cobro estándar
                    ├── TicketPreviewModal.tsx   # Previsualización ticket 80mm
                    ├── KardexView.tsx           # Auditoría inmutable de stock
                    ├── CashShiftView.tsx        # Corte Z y dinero en caja
                    ├── CustomersView.tsx        # Cuentas por cobrar y abonos
                    ├── ReportsView.tsx          # KPIs y gráfico SVG interactivo
                    ├── SettingsGrid.tsx         # 4 tarjetas grandes + modales
                    └── common/
                        └── Icons.tsx            # Lucide Icons tipados
```

---

## 5. Instrucciones de Compilación y Ejecución

### 1. Instalación de dependencias
Asegúrate de encontrarte dentro del directorio de la aplicación:

```powershell
cd c:\xampp\htdocs\nexuspos\nexus-post
npm install
```

### 2. Ejecutar en modo desarrollo
Para iniciar el servidor Vite y la ventana de Electron en vivo:

```powershell
npm run dev
```

### 3. Generar instalador para Windows (.exe)
Para compilar la aplicación empaquetada lista para distribución:

```powershell
npm run build:win
```

---

© 2026 NexusPOS Desktop — Todos los derechos reservados.
