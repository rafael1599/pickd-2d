---
description: Integrar D3.js como visualizador de layout de almacén
---
1. **Instalar D3**
   // turbo
   ```bash
   npm install d3
   ```

2. **Crear componente D3**
   - Crear `src/components/WarehouseD3Visualizer.jsx` con el código provisto a continuación.

3. **Actualizar `stackingEngine.js` (opcional)**
   - Si deseas renombrar propiedades, cambia `w` → `width`, `l` → `height` en los objetos de `placements`.
   - No es obligatorio para que funcione el visualizador D3.

4. **Reemplazar el renderizado actual**
   - En `src/App.jsx` importar y usar `<WarehouseD3Visualizer />` en lugar de `WarehouseVisualizer`.

5. **Añadir estilos premium**
   - Crear/editar `src/styles/warehouse.css` con fondo oscuro, tipografía `Inter`, y sombras suaves.

6. **Probar**
   - Ejecutar `npm run dev` (el servidor ya está en hot‑reload) y verificar que torres aparecen como bloques sólidos y picker‑lines como barras verticales centradas.

7. **(Opcional) Tooltip interactivo**
   - Añadir `title` en cada `<g>` dentro del componente para mostrar información del SKU al pasar el cursor.

// turbo-all
