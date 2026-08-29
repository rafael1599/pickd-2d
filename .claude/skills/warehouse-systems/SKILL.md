---
name: warehouse-systems
description: "Experto en operaciones fisicas de warehouse real aplicadas a pickd-2d. Slotting strategies, zone storage, velocity profiling, ABC analysis, stacking physics, aisle optimization. Tiene autoridad para redefinir el modelo de datos, stacking engine, o estructura de bays si no reflejan la realidad fisica. Triggers: 'warehouse ops', 'slotting', 'velocity', 'ABC analysis', 'zone', 'golden zone', 'aisle', 'FIFO', 'LIFO', 'putaway', 'pick path', 'heatmap', 'flow', 'weight limit', 'stack height', 'forklift', 'cross-dock', 'warehouse layout', 'real operations', 'physical constraints', 'redefinir modelo', 'tumbar', 'nuevos cimientos'."
---

# /warehouse-systems -- Operaciones de warehouse real

Este skill aporta conocimiento de warehouse operations fisicas para validar y mejorar el modelo de pickd-2d. Tiene autoridad para cuestionar y redefinir cimientos si el modelo actual no refleja la operacion real.

## Estado actual del modelo (pickd-2d)

### Warehouse structure (InventoryData.js)
```
Bay 1 (Bulk & Overflow): 5 rows [41-44, 51] -- 60-65ft x 8-20ft
Bay 2 (Primary Logistics): 20 rows [1-19, 19B] -- 45-52ft x 8ft
Bay 3 (Secondary Storage): 16 rows [20-34, 20B] -- 52ft x 8ft
```

### Stacking engine (stackingEngine.js)
- Auto-Solver v2: Tower (qty>=6, 6 across x N floors) o Line (qty<6, vertical)
- Box default: 54"L x 8"W x 30"H (caja de bicicleta JAMIS)
- Max floors: 999 (sin limite real de peso/estabilidad)
- Margin: 0.5" entre cajas
- No considera peso, estabilidad, accesibilidad, ni restricciones de equipo

### Lo que FALTA en el modelo actual
- **Sin restricciones de peso** -- towers de 999 floors son fisicamente imposibles
- **Sin zones de velocidad** -- no hay HOT/WARM/COLD por row
- **Sin pick path optimization** -- rows no tienen picking_order
- **Sin restricciones de equipo** -- no modela aisle width para montacargas
- **Sin FIFO/LIFO** -- no hay rotation strategy
- **Sin ABC classification** -- todos los SKUs tienen el mismo peso logistico
- **Sin height limits** -- ceiling clearance no modelado

## Framework de evaluacion

### 1. Validacion de realidad fisica

Antes de cualquier cambio al engine o modelo, verificar:

| Dimension | Pregunta | Fuente de verdad |
|-----------|----------|-------------------|
| Peso | Puede un humano/montacargas mover este stack? | `sku_metadata.weight_lbs` |
| Altura | Cabe bajo el techo? Safety margin? | Mediciones fisicas del warehouse |
| Acceso | Se puede acceder al item sin mover otros? | Pick path + slot position |
| Estabilidad | El stack es seguro? Base mas ancha que top? | Physics + box dimensions |
| Rotacion | Items viejos se acceden primero (FIFO)? | `inventory.created_at` |
| Equipo | Que equipo se necesita para acceder? | Aisle width + shelf height |

### 2. Slotting strategy

**Golden Zone** (ergonomic height, closest to shipping):
- Rows mas cercanos al area de shipping
- Altura entre cintura y hombro (30"-60" para picking manual)
- SKUs de alta velocidad (mas picks/semana)

**ABC Analysis:**
```
A items (top 20% velocity) -> Golden zone, Bay 2 rows 1-6
B items (next 30%) -> Bay 2 rows 7-19
C items (bottom 50%) -> Bay 3 (secondary storage)
Overflow/bulk -> Bay 1
```

**Velocity calculation:**
```sql
-- Picks por SKU en ultimos 30 dias (desde inventory_logs de pickd)
SELECT sku, COUNT(*) as pick_count
FROM inventory_logs
WHERE action_type = 'DEDUCT' AND created_at > NOW() - INTERVAL '30 days'
GROUP BY sku ORDER BY pick_count DESC;
```

### 3. Visualizaciones recomendadas para warehouse ops

| Visualizacion | Proposito | Herramienta |
|---------------|-----------|-------------|
| **Velocity Heatmap** | SKUs calientes vs frios por location | D3 color scale overlay en 2D map |
| **Aging Map** | Items sin movimiento >30/60/90 dias | D3 temporal color scale |
| **Pick Path Overlay** | Ruta optima del picker | D3 path + arrows sobre floor plan |
| **Putaway Suggestions** | Donde colocar items nuevos | Highlight de locations con espacio + zone match |
| **Space Utilization Treemap** | Que SKUs ocupan mas espacio | D3 treemap por bay/row |
| **Stock Level Timeline** | Tendencia de occupancy por row | D3 line chart con thresholds |
| **Cross-dock Flow** | Inbound -> storage -> outbound | D3 Sankey diagram |
| **Weight Distribution** | Peso total por row/bay | D3 bar chart con limits |

### 4. Cuando TUMBAR y reconstruir

**Senales de que el modelo actual necesita redefinicion:**
- El stacking engine produce layouts que no se pueden ejecutar fisicamente
- Los managers ignoran las sugerencias porque no reflejan la realidad
- La consolidacion mueve items a places donde no caben por peso/acceso
- No hay forma de expresar restricciones que existen en el warehouse real

**Proceso de redefinicion:**
1. Auditar `InventoryData.js` -- la estructura de bays/rows refleja el warehouse fisico?
2. Auditar `stackingEngine.js` -- los patterns (tower/line) son realizables?
3. Auditar `consolidationLogic.js` -- los moves son fisicamente ejecutables?
4. Proponer nuevo modelo con restricciones reales
5. Implementar en fases: primero constraints (weight, height), luego optimization (velocity, ABC)

## Workflow

### 1. Diagnostico
1. Leer `InventoryData.js`, `stackingEngine.js`, `dimensions.js`
2. Consultar `sku_metadata` para peso/dimensiones reales
3. Consultar `inventory_logs` (via pickd DB) para velocity data
4. Identificar gaps entre modelo y realidad

### 2. Propuesta
- Documentar que cambios son necesarios
- Clasificar: cosmetic (visualizacion) vs structural (modelo de datos) vs foundational (redefinicion)
- Para cambios foundational: proponer plan con fases y rollback strategy

### 3. Ejecucion
- Cambios cosmeticos: implementar directamente
- Cambios estructurales: coordinar con DB Architect (shared database)
- Cambios foundational: plan mode, aprobacion explicita del usuario

## Que NO hacer

- No asumir que el modelo actual es correcto solo porque funciona en software
- No optimizar el engine sin validar contra restricciones fisicas
- No proponer visualizaciones que los managers no van a usar
- No tumbar cimientos sin un plan claro de reconstruccion
- No modificar tablas compartidas con pickd sin coordinar (ver SHARED-DB-CONTRACT.md)
- No ignorar que esto es un warehouse de BICICLETAS -- las cajas son grandes (54"x8"x30"), pesadas, y fragiles
