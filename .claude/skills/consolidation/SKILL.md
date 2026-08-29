---
name: consolidation
description: "Workflow de consolidacion de inventario entre bays en pickd-2d. Mover items de Bay 3 a Bay 1/2 con plan optimizado. Triggers: 'consolidation', 'consolidar', 'mover inventario', 'bay 3', 'movement plan', 'reubicacion', 'consolidation report', 'PDF report', 'merge bays'."
---

# /consolidation -- Workflow de consolidacion entre bays

Planificacion y ejecucion de movimientos de inventario de Bay 3 (secondary storage) hacia Bay 1 y Bay 2 (bulk + primary logistics).

## Archivos clave

```
src/engine/consolidationLogic.js  -- Greedy algorithm + binary search fit
src/engine/consolidationReport.js -- PDF generation (jsPDF)
src/components/ConsolidationModal.jsx -- UI de preview y ejecucion
src/components/GlobalView.jsx     -- Trigger button "Consolidar Bay 3"
```

## Workflow completo

### 1. Analisis (consolidationLogic.js)

```
Input:  inventory items in Bay 3 + available space in Bay 1 & 2
Output: ordered movement plan [{sku, from, to, qty}]

Algorithm:
  For each Bay 3 item (sorted by qty DESC):
    For each target row in Bay 1 + Bay 2:
      Binary search: max qty that fits (via stacking engine)
      If fits -> add to movement plan
    If no target found -> mark as "unplaceable"

  Sort movements by proximity (minimize physical distance)
```

### 2. Preview (ConsolidationModal.jsx)

- Stats: total items, reubicables, unplaceable
- Ordered list of movements with FROM/TO
- Estado Real vs Previsualizacion toggle
- Cancel/Confirm buttons

### 3. Ejecucion

```
For each move in plan:
  1. adjust_inventory_quantity(sku, from_location, -qty)  // deducir
  2. adjust_inventory_quantity(sku, to_location, +qty)    // agregar
  3. Update UI state
```

**CRITICO:** Usa el RPC `adjust_inventory_quantity()` -- NUNCA UPDATE directo. El RPC maneja logs, distribution, y location creation automaticamente.

### 4. Reporte PDF (consolidationReport.js)

Genera `Warehouse_Consolidation_Report_YYYY-MM-DD.pdf` con:
- Header con timestamp
- Stats table
- Movement list (SKU, QTY, FROM, TO)

## Reglas de modificacion

- **Atomicidad:** Si falla un movimiento a mitad de plan, los anteriores YA se ejecutaron. Considerar rollback strategy.
- **No mover items de picking activo:** Verificar que el SKU no este en un `picking_list` con status `active` o `double_checking` antes de mover.
- **Coordinar con pickd:** Los movimientos de consolidacion cambian inventory que pickd lee en real-time. Los pickers veran los cambios inmediatamente via realtime subscriptions.
- **Bay structure hardcoded:** Si cambian los rows de cada bay, actualizar tanto `consolidationLogic.js` como `InventoryData.js`.

## Que NO hacer

- No ejecutar consolidation sin preview/confirmacion del usuario
- No modificar el schema de `inventory` -- es compartido con pickd
- No skipear el RPC (p_skip_log: false siempre) -- el audit trail es critico
- No asumir que todos los items de Bay 3 son reubicables -- algunos no caben
