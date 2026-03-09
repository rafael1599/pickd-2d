---
description: Cómo sincronizar la base de datos local de Supabase con producción
---

# Sincronizar Base de Datos Local con Producción

## Prerrequisitos
- Tener Supabase CLI instalado (`npx supabase`)
- Tener el project ref de producción: `xexkttehzpxtviebglei`
- Tener la contraseña de la base de datos de producción

## Paso 1: Linkear proyecto (solo la primera vez o si se deslinkeó)

```bash
npx supabase link --project-ref xexkttehzpxtviebglei
```

Te pedirá la contraseña de la base de datos de producción.

## Paso 2: Reparar historial de migraciones (si hay desajustes)

Si al hacer `db pull` te da error de migration history, ejecuta los comandos `migration repair` que te sugiere la CLI. Ejemplo:

```bash
npx supabase migration repair --status applied 20260211000200
# ... (ejecutar todos los que la CLI sugiera)
```

## Paso 3: Jalar el esquema de producción

```bash
npx supabase db pull
```

Cuando pregunte "Update remote migration history table? [Y/n]", responde **Y**.

Esto genera un archivo en `supabase/migrations/` con el esquema actual de producción.

## Paso 4: Aplicar a la base local

### Opción A: Reset completo (borra todo lo local y re-aplica migraciones)

```bash
# Si ya hay un proyecto corriendo, apágalo primero
npx supabase stop --project-id warehouse-ops-app

# Enciende y resetea
npx supabase start
npx supabase db reset
```

### Opción B: Aplicar solo la migración nueva (preserva datos locales)

1. Abre Supabase Studio local: `http://localhost:54323`
2. Ve al **SQL Editor**
3. Pega el contenido del archivo de migración generado en `supabase/migrations/`
4. Ejecuta

### Opción C: Vía psql directo

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" < supabase/migrations/NOMBRE_DEL_ARCHIVO.sql
```

## Notas Importantes

- El puerto local de Supabase es **54322** (DB) y **54323** (Studio)
- El proyecto local se identifica como `warehouse-ops-app`
- Si ves "port is already allocated", significa que ya hay una instancia corriendo. Usa `npx supabase stop --project-id warehouse-ops-app` primero
- Si quieres también traer los **datos** de producción (no solo esquema), usa:
  ```bash
  npx supabase db dump --data-only -f supabase/seed.sql
  ```
  Y luego cárgalo con la Opción C usando ese archivo
