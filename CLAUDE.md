# Instrucciones para Claude -- pickd-2d

Dashboard de visualizacion 2D/3D y planificacion estrategica de warehouse. Companion app de **pickd** (PWA operacional). Ambas apps comparten la misma base de datos Supabase.

## Tech Stack

- **Frontend:** React 19 + JavaScript (JSDoc) + Vite 7 + Tailwind CSS 4
- **3D:** Three.js + @react-three/fiber + @react-three/drei
- **2D:** D3.js (canvas/SVG de warehouse layout)
- **State:** Valtio (reactive proxy state para performance 3D)
- **DB:** PostgreSQL via Supabase (misma instancia que pickd)
- **PDF:** jsPDF + jspdf-autotable (reportes de consolidacion)
- **Package manager:** npm

## Estructura clave

```
src/
  components/       -- UI views (GlobalView, BayDetail, RowDetail, 3D)
  engine/           -- Stacking engine, consolidation logic, reports
  rendering/        -- Color palette, visual helpers
  store/            -- Valtio state
  InventoryData.js  -- Warehouse structure (bays, rows, dimensions)
  supabaseClient.js -- Supabase client init
```

## Base de datos compartida con pickd

**CRITICO:** Esta app y pickd usan la MISMA base de datos Supabase.

### Tablas que pickd-2d LEE (read-only desde esta app):
- `inventory` -- stock actual por SKU/location
- `sku_metadata` -- dimensiones de producto (L, W, H)
- `locations` -- dimensiones de rows (length_ft, width_ft, inches)

### Tablas que pickd-2d ESCRIBE:
- `locations` -- actualiza dimensiones (length_ft, length_in, width_ft, width_in)
- `inventory` -- solo via consolidation moves (adjust_inventory_quantity RPC)

### Tablas que pickd-2d NO TOCA:
- `picking_lists`, `picking_list_notes` -- dominio exclusivo de pickd
- `profiles`, `user_presence` -- gestionado por pickd
- `inventory_logs` -- escrito indirectamente via RPCs
- `daily_inventory_snapshots` -- edge functions only
- `customers`, `order_groups`, `pdf_import_log` -- dominio de pickd

### RPCs compartidas (SECURITY DEFINER):
- `adjust_inventory_quantity()` -- usada en consolidation moves
- `resolve_location()` -- helper de normalizacion

### Regla de oro
> Nunca modificar el schema de tablas compartidas sin coordinar con pickd.
> Nunca crear migraciones que rompan RPCs que pickd usa.
> Ante la duda, preguntar antes de tocar la DB.

## Warehouse structure (hardcoded)

```
Bay 1 (Bulk & Overflow): rows [41, 42, 43, 44, 51]
Bay 2 (Primary Logistics): rows [1-19, 19B]
Bay 3 (Secondary Storage): rows [20, 20B, 21-34]
```

- Dimensiones base en `InventoryData.js`, overrideable via DB (`locations` table)
- Row 43: tipo "block" (65ft x 20ft), el resto 8ft de ancho
- Unidades internas: todo en inches para precision

## Stacking Engine (Auto-Solver v2)

- Items sorted by qty descending
- qty >= 6 -> Tower pattern (6 slots across width, stacked)
- qty < 6 -> Line pattern (end-to-end along row length)
- Box default: 54"L x 8"W x 30"H, margin 0.5"

## Consolidation workflow

```
Bay 3 items -> analyze fit in Bay 1 & 2 -> generate movement plan ->
preview modal -> confirm -> execute via adjust_inventory_quantity RPC -> PDF report
```

## Convenciones

- **JavaScript** (no TypeScript). JSDoc para type hints.
- **No imports cross-feature** entre pickd y pickd-2d.
- **Formatting:** No formatear archivos que no se estan editando.
- **Git:** comandos separados (add, commit, push).
- **Antes de tocar schema compartido:** preguntar primero.

## Team Mode

Prompt para iniciar sesion con team mode (copiar y pegar al iniciar Claude Code en este proyecto):

```
Create a team with 5 teammates for pickd-2d warehouse visualization app:

1. **DB Architect** (Sonnet) - Guardian de la base de datos compartida entre pickd y pickd-2d.
   Revisa TODAS las migraciones, RPCs, y cambios de schema contra SHARED-DB-CONTRACT.md.
   Valida que ningun cambio rompa pickd. Antes de tocar inventory o locations, verifica
   que no hay picking_lists activas usando esos SKUs. Conoce los 14 tables, 20+ RPCs,
   y las RLS policies de memoria.

2. **3D/Visualization Engineer** (Sonnet) - Especialista en Three.js (@react-three/fiber, drei),
   D3.js, y el stacking engine (src/engine/). Maneja rendering, spatial calculations,
   GPU instancing (SKUInstances.jsx), Valtio state reactivo, y performance de escenas
   con 1000+ boxes. Domina la conversion inches<->feet y el coordinate system
   (engine X = row width, engine Y = row depth).

3. **Consolidation Planner** (Sonnet) - Owner del workflow de consolidacion Bay 3 -> Bay 1&2.
   Greedy algorithm, binary search fit, ejecucion via adjust_inventory_quantity RPC,
   y generacion de PDF reports. Verifica que los moves no conflicten con picking activo.
   Optimiza por proximidad fisica.

4. **UX/UI Designer** (Sonnet) - Responsable de la experiencia de usuario completa.
   Domina el frontend-design skill (aesthetics guide). Diseña interfaces que warehouse
   managers realmente usarian: dashboards claros, visualizaciones intuitivas de occupancy,
   color coding efectivo de SKUs, interacciones responsive (hover, click, drill-down),
   mobile considerations para tablets en el warehouse floor. Critica sin piedad
   interfaces que parezcan "AI slop" o que no sirvan para tomar decisiones reales.
   Tiene autoridad para proponer redisenos completos de cualquier vista.

5. **Warehouse Systems Architect** (Sonnet) - Experto en operaciones fisicas de warehouse
   real (no solo software). Conoce slotting strategies, zone-based storage, velocity
   profiling, ABC analysis, golden zone placement, aisle optimization, y cross-docking.
   Evalua si el stacking engine y el modelo de datos reflejan la realidad fisica:
   peso de cajas, estabilidad de stacks, accesibilidad de picking, restricciones de
   montacargas/aisle width, FIFO/LIFO rotation. Tiene autoridad para TUMBAR
   el modelo actual de datos de InventoryData.js, el stacking engine, o la estructura
   de bays/rows si no refleja la operacion real. Propone las mejores herramientas
   de visualizacion para warehouse ops (heatmaps de velocidad, aging maps, flow
   diagrams, putaway vs pick path overlays). Puede redefinir cimientos si el modelo
   actual limita la operacion.
```

## Skills

Symlinked desde `~/Documents/Projects/skills/project-skills/pickd-2d/`.

### Skills disponibles
- `supabase` -- operaciones DB (adaptado para shared DB pickd/pickd-2d)
- `stacking-engine` -- Auto-Solver v2, placement patterns, capacity calculations
- `consolidation` -- workflow de consolidacion Bay 3 -> Bay 1&2
- `ux-ui` -- diseno de interfaces para warehouse managers (dashboard, drill-down, tablet)
- `warehouse-systems` -- operaciones fisicas reales, slotting, velocity, puede redefinir cimientos
