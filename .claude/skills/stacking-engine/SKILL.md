---
name: stacking-engine
description: "Modificaciones al Auto-Solver v2 del stacking engine de pickd-2d. Algoritmo de placement de SKUs en rows del warehouse (tower/line patterns). Triggers: 'stacking', 'auto-solver', 'placement', 'tower pattern', 'line pattern', 'layout algorithm', 'how items are placed', 'fix stacking', 'engine', 'capacity calculation'."
---

# /stacking-engine -- Auto-Solver v2

Motor de placement que calcula como se distribuyen los items fisicamente dentro de cada row del warehouse.

## Archivos clave

```
src/engine/stackingEngine.js    -- Algoritmo principal
src/engine/dimensions.js        -- Constantes (box sizes, margins)
src/engine/placementOptimizer.js -- Collapse logic para 2D/3D render
```

## Workflow

### 1. Antes de modificar

1. Leer `src/engine/stackingEngine.js` completo
2. Leer `src/engine/dimensions.js` para constantes
3. Entender el input: `{ items: [{sku, qty}], rowLength, rowWidth }` (todo en inches)
4. Entender el output: `{ placements: [...], warnings: [], groups: {...}, usedLengthFt, usedLengthIn }`

### 2. Algoritmo actual

```
Items sorted by qty DESC
For each item:
  if first item OR qty >= 6 -> TOWER pattern
    - 6 slots across width
    - Stack vertically (max 999 floors)
    - groupId: T1, T2, T3...
  else -> LINE pattern
    - Place end-to-end along row length
    - Single layer
    - groupId: L1, L2, L3...
```

**Placement output per item:**
```js
{ sku, qty, floor, x, y, groupId, pattern: "tower"|"line", width, length, height }
```

### 3. Reglas de modificacion

- **No romper el contrato de output** -- `GlobalView`, `BayDetailView`, `RowDetailView`, y `Warehouse3DVisualizer` consumen `placements[]`
- **Mantener groupId format** -- `T{n}` para towers, `L{n}` para lines (usado en color grouping)
- **Unidades siempre en inches** internamente
- **Box dimensions default** (54"L x 8"W x 30"H) vienen de `dimensions.js`
- **Margin 0.5"** entre items -- definido en constants
- Si cambias capacity calculation, verificar que `GlobalView` no muestre overflow incorrecto

### 4. Testing

```bash
node src/engine/test.js  # Dev test runner
```

Verificar visualmente en RowDetailView (2D canvas) y Warehouse3DVisualizer (3D).

## Que NO hacer

- No cambiar unidades a feet -- todo interno es inches
- No eliminar el campo `floor` -- 3D rendering depende de el
- No hardcodear dimensiones de SKU -- deben venir de `sku_metadata` via Supabase
- No modificar `placementOptimizer.js` sin entender que `SKUInstances.jsx` lo consume para GPU instancing
