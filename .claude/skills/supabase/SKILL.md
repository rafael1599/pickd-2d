---
name: supabase
description: "Operaciones con Supabase en pickd-2d: queries de inventario, dimensiones de locations, testing SQL local, migraciones compartidas, debugging. IMPORTANTE: pickd-2d comparte DB con pickd -- nunca modificar schema sin coordinar. Triggers: 'test sql', 'run query', 'supabase', 'migration', 'db reset', 'sync db', 'check db', 'psql', 'database', 'inventory query', 'location dimensions'."
---

# /supabase -- Operaciones Supabase para pickd-2d

## Contexto critico

pickd-2d comparte la base de datos Supabase con pickd (PWA de picking).
- pickd-2d es principalmente **read-only** (lee inventory, sku_metadata, locations)
- Escribe solo en: `locations` (dimensiones) y `inventory` (via consolidation RPCs)
- **NUNCA** modificar tablas de dominio pickd: `picking_lists`, `picking_list_notes`, `profiles`, `customers`, `order_groups`

## Reglas de acceso a la DB local

### Container name

El container puede ser `supabase_db_pickd-2d` o `supabase_db_pickd`. Verificar con:

```bash
docker ps --format '{{.Names}}' | grep supabase_db
```

### Dos usuarios, dos propositos

| Usuario          | Comando                                                                        | Acceso                                  |
| ---------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| `postgres`       | `docker exec CONTAINER psql -U postgres -d postgres -c "SQL"`                  | `public.*` (inventory, locations, etc.) |
| `supabase_admin` | `docker exec -e PGPASSWORD=postgres CONTAINER psql -U supabase_admin -d postgres -c "SQL"` | `auth.*`, `public.*`, triggers, grants  |

### Lo que NO funciona

- `psql` directo en el host -- no esta instalado, solo dentro del container
- `npx supabase db exec` -- no existe
- `-U postgres` para tablas de `auth.*` -- necesita `supabase_admin`

---

## CASO 1: Queries de lectura (uso principal de pickd-2d)

**Inventario por warehouse/location:**
```sql
SELECT sku, quantity, location, warehouse FROM inventory
WHERE warehouse = 'LUDLOW' AND is_active = true ORDER BY location;
```

**Dimensiones de locations:**
```sql
SELECT location, length_ft, length_in, width_ft, width_in FROM locations
WHERE warehouse = 'LUDLOW';
```

**SKU metadata (dimensiones de producto):**
```sql
SELECT sku, length_in, width_in, height_in FROM sku_metadata WHERE sku = 'XX-XXXXXX';
```

**Inventario agrupado por row (para bay views):**
```sql
SELECT location, COUNT(DISTINCT sku) as sku_count, SUM(quantity) as total_units
FROM inventory WHERE warehouse = 'LUDLOW' AND is_active = true
GROUP BY location ORDER BY location;
```

---

## CASO 2: Actualizar dimensiones de locations

**Cuando:** El usuario edita dimensiones de un row en RowDetailView.

```sql
UPDATE locations SET length_ft = X, length_in = Y, width_ft = Z, width_in = W
WHERE location = 'ROW N' AND warehouse = 'LUDLOW';
```

**Nota:** Esto es seguro -- pickd lee locations pero no modifica dimensiones.

---

## CASO 3: Consolidation moves (escritura a inventory)

**Cuando:** Se ejecuta un plan de consolidacion.

Usar SIEMPRE el RPC `adjust_inventory_quantity()` -- nunca UPDATE directo a inventory.

```sql
SELECT public.adjust_inventory_quantity(
  p_sku := 'SKU',
  p_warehouse := 'LUDLOW',
  p_location := 'ROW X',
  p_delta := -10,  -- deducir del origen
  p_performed_by := 'pickd-2d consolidation',
  p_user_id := NULL,
  p_user_role := 'admin',
  p_list_id := NULL,
  p_order_number := NULL,
  p_merge_note := 'Consolidation Bay 3 -> Bay 2',
  p_skip_log := false
);
```

**Regla:** Siempre deducir del origen Y agregar al destino en la misma transaccion.

---

## CASO 4: Migraciones compartidas

**PELIGRO:** Cualquier migracion en pickd-2d afecta la misma DB que pickd.

**Antes de crear una migracion:**
1. Verificar que no rompe RPCs de pickd:
   ```bash
   grep -r "\.rpc(" /path/to/pickd/src/ --include="*.ts" --include="*.tsx" -h | sort -u
   ```
2. Solo usar `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`
3. NUNCA `DROP`, `RENAME`, o `ALTER TYPE` sin coordinar con pickd
4. Nombrar: `YYYYMMDDHHMMSS_pickd2d_descripcion.sql` (prefijo pickd2d para identificar origen)

---

## CASO 5: Debugging

| Error | Causa | Fix |
|-------|-------|-----|
| `inventory` vacio | DB local no synced | Sync data desde pickd |
| `locations` sin dimensiones | Columnas inch no migradas | Verificar migracion `add_inches_to_locations` |
| RPC no existe | Migraciones de pickd no aplicadas | Aplicar migraciones de pickd primero |
| Datos desactualizados | pickd modifico inventory | Refresh query / realtime subscription |

---

## Referencia rapida

| Dato | Valor |
|------|-------|
| Container DB | Verificar con `docker ps` |
| Tablas principales | `inventory`, `sku_metadata`, `locations` |
| RPC de escritura | `adjust_inventory_quantity()` |
| Migraciones dir | `supabase/migrations/` |
| DB compartida con | pickd (PWA de picking) |
