# BACKLOG — pickd-2d

Futuros cambios priorizados por valor para el equipo de warehouse.

---

## P0 — Necesario

- [ ] **Zonas por velocity real, no por proximidad al dock** — Calcular HOT/WARM/COLD desde inventory_logs (picks/semana por row). Las zonas hardcodeadas por posición física no reflejan la operación real. Requiere: query a inventory_logs, algoritmo de clasificación ABC, actualizar ZONE_MAP dinámicamente.

## P1 — Alta prioridad

- [ ] **Histórico de movimiento por row** — Gráfica de tendencia (últimos 7/30 días) usando daily_inventory_snapshots. Ver cómo sube/baja el inventario en cada row.
- [ ] **Velocity score por SKU** — Clasificación A/B/C basada en frecuencia real de picks desde inventory_logs. Mostrar en el detalle del SKU.
- [ ] **Alertas de slotting incorrecto** — SKU de alta velocidad en zona COLD = alerta. Sugerir reubicación.

## P2 — Media prioridad

- [ ] **Block storage algorithm para Row 43** — Stacking engine actual usa tower/line en el área de 65x20ft. Necesita grid de pallets con lanes de acceso para montacargas.
- [ ] **Verificar posición física de Row 51** — ¿Está junto a rows 41-44 o es un área separada? Afecta la representación visual.
- [ ] **Techo real en stacking engine** — MAX_FLOORS ya está en 6, pero debería ser configurable por row (algunas áreas tienen diferente clear height).

## P3 — Nice to have

- [ ] **Pick path overlay** — Mostrar ruta óptima de picking usando picking_order de la DB.
- [ ] **Active picks indicator** — Mostrar qué rows tienen picking_lists activas (requiere parsear JSONB items de pickd).
- [ ] **Heatmap de actividad** — Color intensity basado en movimientos/semana por row.
- [ ] **Dark/aging inventory** — Highlight de producto que lleva >30 días sin moverse.
- [ ] **Mobile responsive refinement** — Optimizar para <768px (stacking vertical de bays).

---

*Última actualización: 2026-03-26*
