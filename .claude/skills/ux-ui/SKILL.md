---
name: ux-ui
description: "Diseno UX/UI para pickd-2d: interfaces de warehouse dashboard, visualizacion de datos de inventario, color systems, interacciones drill-down, responsive para tablets. Triggers: 'ui', 'ux', 'redesign', 'layout', 'dashboard', 'color', 'responsive', 'tablet', 'interaction', 'hover', 'tooltip', 'mobile', 'redesena', 'interfaz', 'visual design', 'occupancy view'."
---

# /ux-ui -- Diseno de interfaz para pickd-2d

Guia de diseno para el warehouse visualization dashboard. Las decisiones de UI deben servir para que warehouse managers tomen decisiones reales, no para impresionar en un demo.

## Contexto del usuario

- **Usuarios:** Warehouse managers en escritorio o tablet (warehouse floor)
- **Ambiente:** Oficina + warehouse con iluminacion variable
- **Frecuencia:** Uso diario, sesiones de 5-30 minutos
- **Objetivo:** Tomar decisiones de consolidacion, identificar problemas de espacio, planificar movimientos

## Vistas actuales

| Vista | Archivo | Proposito |
|-------|---------|-----------|
| Global View | `src/components/GlobalView.jsx` | Overview de 3 bays con stats |
| Bay Detail | `src/components/BayDetailView.jsx` | Rows dentro de un bay |
| Row Detail | `src/components/RowDetailView.jsx` | 2D canvas + SKU panel + edicion |
| 3D Visualizer | `src/components/Warehouse3DVisualizer.jsx` | Vista inmersiva 3D |
| Consolidation Modal | `src/components/ConsolidationModal.jsx` | Preview de movimientos |
| SKU Detail Panel | `src/components/SkuDetailPanel.jsx` | Detalle de items en row |
| Common | `src/components/Common.jsx` | Tooltip, StatCard reutilizables |

## Principios de diseno para warehouse ops

### 1. Informacion al glance
- Occupancy: verde (<70%), amarillo (70-90%), rojo (>90%), rojo pulsante (overflow)
- Numeros grandes y legibles (warehouse managers no tienen tiempo para tooltips)
- Status claro sin ambiguedad: "SPACE OK" vs "OVERFLOW 12 units"

### 2. Navegacion drill-down
```
Global (3 bays) -> Bay (N rows) -> Row (SKUs + 2D canvas) -> SKU detail
```
- Back button siempre visible
- Breadcrumbs opcionales
- Keyboard nav (arrow keys ya implementado en BayDetailView)

### 3. Color system
- SKU colors: deterministic hash via `src/rendering/colorPalette.js`
- Consistencia obligatoria entre 2D canvas, 3D view, y panels
- No usar rojo para SKUs (reservado para warnings/overflow)
- Alto contraste para uso en warehouse con iluminacion pobre

### 4. Tablet considerations
- Touch targets minimo 44px
- No hover-only interactions (tooltips deben funcionar con tap)
- Font sizes minimo 14px en data tables
- Scroll vertical preferido sobre horizontal

### 5. Data density
- Warehouse managers quieren MUCHOS datos en pantalla
- No sacrificar densidad por "clean design"
- Tables > cards para datos comparativos
- Sparklines o mini-bars para tendencias

## Workflow de rediseno

### 1. Antes de cambiar
1. Leer el componente actual completo
2. Entender que datos consume y de donde (Supabase queries, Valtio store, props)
3. Identificar que decision del usuario soporta esa vista

### 2. Evaluacion critica
- Sirve esta vista para tomar una decision real?
- Puede un warehouse manager entender esto en <3 segundos?
- Funciona en tablet (1024px width)?
- Los colores comunican prioridad correctamente?

### 3. Implementacion
- Tailwind CSS 4 (ya configurado)
- Componentes reutilizables en `Common.jsx`
- Animaciones: CSS transitions para UI, no para datos criticos
- Performance: virtualizar listas si >50 items

## Que NO hacer

- No usar gradientes decorativos que distraigan de los datos
- No esconder informacion critica detras de hover/tooltips solamente
- No disenar para screenshot de portfolio -- disenar para warehouse floor
- No cambiar el color palette de SKUs sin actualizar `colorPalette.js` y verificar en 2D + 3D
- No agregar modals donde un inline expansion funciona mejor
