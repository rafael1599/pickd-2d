# Visión Arquitectónica — Warehouse Ops 2D Planner
> Modelo 4+1 · Fuente de Verdad del Proyecto

## 1. Contexto del Problema
Se requiere una interfaz gráfica 2D interactiva para planificación de espacio en un almacén de distribución. Actualmente la redistribución se hace dibujando en papel, lo que introduce error humano y doble trabajo cuando los cálculos no cuadran con la realidad física.

## 2. Jerarquía del Almacén
```
Warehouse
├── Bay 1 (11 rows: 1–11)
├── Bay 2 (11 rows: 12–20B)
└── Bay 3 (19 rows: 21–34, 41–44, 51)
    └── Row X (isla)
        ├── Dimensiones base: length_ft y width_in (usaremos datos simulados hasta que Supabase los provea todos). El ancho es dinámico según la necesidad del producto.
        ├── Unidades (Bikes/Accesorios): Usaremos las cajas/SKUs con dimensiones simuladas por ahora. La terminología sigue usando "totalBikes" y "bikeLine" internamente.
        └── Restricciones:
            ├── Margen: 0.5" en 4 costados horizontales (no arriba/abajo)
            ├── Altura máxima: 5 pisos
            ├── No mezclar SKU en torres
            └── Sí mezclar SKU en líneas
```

## 3. Patrones de Apilamiento

### Línea (Line)
- Cajas alineadas en paralelo, una al lado de la otra a lo largo de la isla.
- Se apilan hasta 5 pisos de alto.
- **Sí se permiten** múltiples SKUs en la misma línea.

### Torre (Tower)
- Base de 6 cajas (2×3 ó 3×2).
- Cada piso alterno se cruza (rotación 90°) para estabilidad.
- Hasta 5 pisos = 30 cajas máximo por torre.
- **No se permiten** múltiples SKUs en la misma torre.

### Reglas de Estabilidad de Fila (Row Stability)
Esta aplicación genera secuencias de carga (Load Sequencing) garantizando que ninguna isla colapse:
1. **Inicio y Fin de Fila:** Toda fila debe comenzar y terminar obligatoriamente con una Torre para anclar la estructura.
2. **Límite de Inestabilidad:** Se permite un máximo de **6 Líneas consecutivas**. Al llegar al límite, el algoritmo fuerza la creación de una Torre estabilizadora.
3. **Optimización de Espacio:** Mientras el inventario lo permita y no se rompan las reglas 1 y 2, el motor intentará usar Líneas para comprimir la profundidad ocupada en el pasillo.

## 4. Restricciones Físicas
| Restricción | Valor | Notas |
|------------|-------|-------|
| Margen entre cajas | 0.5 pulgadas | Solo 4 costados horizontales |
| Pisos máximos | 5 | Aplica a líneas y torres |
| Mezcla en torre | ❌ Prohibida | Un SKU por torre |
| Mezcla en línea | ✅ Permitida | Múltiples SKUs |
| Lienzo visual | Fijo | No se redistribuyen cajas al cambiar ventana |

## 5. Vista de Escenarios (+1)

### Escenario A: Planificación de Redistribución
- **Actor:** Planeador de Almacén (desktop only)
- **Flujo:** Selecciona Row → Elige SKU → Ingresa cantidad → Sistema calcula acomodo automático respetando márgenes → Visualización en canvas 2D a escala fija
- **Salida:** Plan de colocación verificado visualmente antes de ejecutarlo en planta

### Escenario B: Validación de Capacidad
- **Actor:** Planeador de Almacén
- **Flujo:** Selecciona Row → Ve capacidad actual vs. máxima → Sistema advierte si la cantidad solicitada excede el espacio disponible

## 6. Pila Tecnológica (C4 Nivel 2)
- **Frontend:** Vite + React 19 + TailwindCSS v4
- **Rendering:** HTML Canvas (dibujo dinámico con matriz de transformación para zoom/pan) e Intersección Hit-Testing manual para Tooltips interactivos tipo HUD.
- **Backend/Data:** Supabase (PostgreSQL) vía API — espejo Docker de producción
- **Plataforma:** Solo navegador desktop

---
*Documento vivo. Última actualización: 2026-02-26.*
