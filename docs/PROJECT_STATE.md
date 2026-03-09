# PICKD-2D — Estado Actual del Proyecto

> Última actualización: 2026-03-08

---

## 1. Estructura del Proyecto

```
pickd-2d/
├── src/
│   ├── App.jsx                          # Entry point
│   ├── WarehouseVisualizer.jsx          # Contenedor principal (state root)
│   ├── InventoryData.js                 # Estructura warehouse, rows, inventario inicial
│   ├── supabaseClient.js               # Instancia Supabase
│   ├── main.jsx                         # React entry
│   ├── index.css                        # Tailwind global
│   │
│   ├── components/
│   │   ├── GlobalView.jsx               # Dashboard 3-bays
│   │   ├── BayDetailView.jsx            # Vista de un bay con rows
│   │   ├── RowDetailView.jsx            # Planner interactivo de row
│   │   ├── WarehouseD3Visualizer.jsx    # Renderer 2D (SVG/D3)
│   │   ├── WarehouseCanvas.jsx          # Renderer 2D (Canvas)
│   │   ├── Warehouse3DVisualizer.jsx    # Renderer 3D (Three.js/R3F)
│   │   ├── ConsolidationModal.jsx       # Modal plan de consolidación
│   │   ├── SkuDetailPanel.jsx           # Panel de specs + controles qty
│   │   ├── Common.jsx                   # Tooltip & StatCard
│   │   └── 3D/
│   │       ├── Location3D.jsx           # Wireframe del rack
│   │       └── SKUInstances.jsx         # InstancedMesh rendering
│   │
│   ├── engine/
│   │   ├── dimensions.js                # Constantes (BOX_MARGIN, MAX_FLOORS, DEFAULT_BOX)
│   │   ├── stackingEngine.js            # Solver de layout (solveAutoLayout)
│   │   ├── placementOptimizer.js        # Optimización de render (collapseFor2D/3D)
│   │   ├── consolidationLogic.js        # Algoritmo de consolidación Bay 3 → 1 & 2
│   │   └── consolidationReport.js       # Generación PDF (jsPDF)
│   │
│   ├── rendering/
│   │   ├── canvasRenderer.js            # drawRow, drawBox, drawHalo, drawLabels
│   │   └── colorPalette.js              # Colores SKU (HSL hash)
│   │
│   ├── store/
│   │   └── state.js                     # Valtio store (3D high-freq updates)
│   │
│   └── styles/
│       └── warehouse.css                # Tooltip D3, grid styles
│
├── docs/
│   └── architecture/
│       └── 00_vision_arquitectonica.md  # Visión arquitectónica
│
├── supabase/                            # Config Supabase local
├── .env                                 # SUPABASE_URL + ANON_KEY
├── vite.config.js                       # Vite config
└── package.json                         # Deps & scripts
```

---

## 2. Tech Stack

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React | 19.2.0 |
| Build | Vite | 7.3.1 |
| Styling | TailwindCSS | 4.2.1 |
| 2D Render | D3.js | 7.9.0 |
| 3D Engine | Three.js | 0.183.2 |
| 3D React | @react-three/fiber | 9.5.0 |
| 3D Helpers | @react-three/drei | 10.7.7 |
| State | Valtio | 2.3.1 |
| Database | Supabase JS | 2.98.0 |
| PDF | jsPDF + autotable | 4.2.0 / 5.0.7 |

---

## 3. Flujo de Datos

```
Supabase (PostgreSQL)
  │
  ├── inventory       → { sku, location, quantity }
  ├── sku_metadata    → { sku, length_in, width_in, height_in, sku_note }
  └── locations       → { location, length_ft, length_in, width_ft, width_in }
  │
  ▼
WarehouseVisualizer.jsx (state root)
  ├── inventory{}      → agrupado por rowId
  ├── skuMap{}         → dimensiones SKU indexadas
  ├── locationsMap{}   → dimensiones de rows
  │
  ▼
solveAutoLayout(rowData, skuMap, inventory)
  │
  ▼
{ placements[], groups{}, warnings[] }
  │
  ├─► collapseFor2D() → WarehouseD3Visualizer / canvasRenderer
  └─► collapseFor3D() → SKUInstances (3D)
```

---

## 4. Navegación y Vistas

```
Global View  ──click bay──►  Bay Detail  ──click row──►  Row Planner
     │                                                         │
     └──── "3D View" ────►  Warehouse3DVisualizer              │
                                   │                           │
                              "← Volver"                  "← Back"
```

- **Global**: 3 tarjetas de bay, stats, botón consolidar, botón 3D
- **Bay Detail**: Barras de progreso por row, % ocupación
- **Row Planner**: Canvas 2D + panel de detalle SKU + edición qty
- **3D View**: Escena Three.js con orbit controls, instancias

---

## 5. Motor de Stacking (`stackingEngine.js`)

### `solveAutoLayout(rowData, skuMap, inventory)`

1. Ordena inventario por qty descendente
2. Por cada SKU (nunca mezcla SKUs en un grupo):
   - **Torre** (qty ≥ 6): Base de 6 cajas, pisos alternados 90°, hasta MAX_FLOORS
   - **Línea** (qty < 6): Columna vertical centrada
3. Avanza cursor Y por el footprint de cada grupo
4. Retorna `{ placements, groups, warnings, usedLengthIn, rowLengthIn }`

### Placement Object
```javascript
{
  sku, x, y, z,          // posición en pulgadas
  w, l, h,               // dimensiones originales
  floor,                 // piso (1-indexed)
  pattern,               // 'tower' | 'line'
  rotation,              // 0 | 90
  groupId                // 'T1', 'T2', 'L1', etc.
}
```

### Constantes (`dimensions.js`)
- `BOX_MARGIN = 0.5"` (horizontal sides only)
- `MAX_FLOORS = 999`
- `DEFAULT_BOX = { L: 54", W: 8", H: 30" }`

---

## 6. Optimización de Render (`placementOptimizer.js`)

### `collapseFor2D(placements)`
- Solo retorna la caja del piso superior por cada posición (x, y)
- Las inferiores están 100% ocultas en vista top-down
- Reduce elementos SVG/Canvas dramáticamente

### `collapseFor3D(placements, skuMap)`
- Pisos inferiores → 1 bloque base consolidado (`_isBase: true`, `h = (topFloor-1) * unitH`)
- Piso superior → cajas individuales intactas
- Resultado visual idéntico, fracción de los draw calls

---

## 7. Pipeline de Rendering

### 2D — D3/SVG (`WarehouseD3Visualizer.jsx`)
- Scale: 4px/inch
- Coordenadas: engine Y → screen X, engine X → screen Y
- Render: grid → boundary → boxes (top-floor) → labels → rulers
- Interacción: hover tooltip, click → SkuDetailPanel

### 2D — Canvas (`canvasRenderer.js` + `WarehouseCanvas.jsx`)
- `drawRow()`: grid → boxes (top-floor via collapseFor2D) → halo hover → labels
- Pan + zoom con mouse drag/wheel
- Hit testing por bounding box de grupos

### 3D — Three.js/R3F (`Warehouse3DVisualizer.jsx` + `SKUInstances.jsx`)
- Canvas: shadows, frameloop="demand", fov=40
- Lighting: ambient + spot + point
- Environment: Sky (night) + ContactShadows
- Boxes: InstancedMesh via `<Instances>`, matrices compuestas por posición/escala
- Solo top-floor captura eventos (pointer)
- Valtio store para selección (sin re-render)

---

## 8. Consolidación

### `generateConsolidationPlan(inventory, skuMap)`
- Source: Bay 3 (rows 20–34, 20B)
- Target: Bay 1 & 2 (rows 1–19, 19B, 41–44, 51)
- Algoritmo greedy: intenta colocar incrementalmente en target rows
- Retorna movimientos: `{ sku, from, to, qty }`

### `generatePDFReport(consolidationResult)`
- PDF con jsPDF: título, timestamp, stats, tabla de movimientos
- Nombre: `Warehouse_Consolidation_Report_YYYY-MM-DD.pdf`

---

## 9. Esquema de Base de Datos (Supabase)

### `inventory`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | bigint (PK) | auto-generated |
| sku | text | FK → sku_metadata |
| location | text | e.g. "ROW 43" |
| quantity | integer | default 0, check ≥ 0 |
| distribution | jsonb | default '[]', array check |
| location_id | uuid | FK → locations |
| is_active | boolean | default true |
| item_name | text | |
| warehouse | text | |
| internal_note | text | |
| created_at / updated_at | timestamptz | |

**Constraints:** unique(warehouse, sku, location)
**Triggers:** updated_at auto, sequence sync, uppercase enforce

### `distribution` JSONB format
```json
[
  { "type": "TOWER", "count": 1, "units_each": 32 },
  { "type": "LINE", "count": 1, "units_each": 5 }
]
```
> **Nota:** El campo `distribution` NO se usa actualmente en la app. El engine calcula layouts solo con `quantity`. El JSONB está poblado en DB para uso futuro.

### `sku_metadata`
| Campo | Tipo |
|-------|------|
| sku | text (PK) |
| length_in | numeric |
| width_in | numeric |
| height_in | numeric |
| sku_note | text |

### `locations`
| Campo | Tipo |
|-------|------|
| id | uuid (PK) |
| location | text |
| length_ft / length_in | numeric |
| width_ft / width_in | numeric |

---

## 10. Estructura del Warehouse

### Bay 1 — Bulk & Overflow (5 rows)
- Rows: 41, 42, 43, 44, 51
- Row 43: 65' × 26' (block type, oversized)

### Bay 2 — Primary Logistics (20 rows)
- Rows: 1–19, 19B
- Estándar: 52' × 8'
- Rows 4–6, 13–15: 45' × 8'

### Bay 3 — Secondary Storage (16 rows)
- Rows: 20–34, 20B
- Fuente de consolidación

---

## 11. Tema Visual

- **Background**: `#050507` / `#0a0a0c`
- **Accent**: Orange-500 `#f97316`
- **Text**: White con opacidades variables
- **Borders**: White 5–10% opacity
- **Fonts**: Inter (UI), JetBrains Mono (data)
- **SKU Colors**: HSL hash determinístico por SKU string

---

## 12. Comandos

```bash
npm run dev       # Dev server (Vite, HMR)
npm run build     # Production build → dist/
npm run preview   # Serve dist/ locally
```

---

## 13. Cambios Recientes

| Fecha | Cambio |
|-------|--------|
| 2026-03-08 | **Fix stacking engine**: cada torre/línea usa UN solo SKU (antes mezclaba todos los SKUs de la row en un solo grupo) |
| 2026-03-08 | **Placement optimizer**: `collapseFor2D()` elimina cajas ocultas en 2D, `collapseFor3D()` consolida pisos inferiores en bloque base |
| 2026-03-08 | **Migration DB**: distribution JSONB poblado con torre única para items con distribution vacío |
