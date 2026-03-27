# Warehouse Floor Plan — Design Spec
**Task:** #2 | **Author:** UX/UI Designer | **Date:** 2026-03-26

---

## 1. Purpose & User Need

The current GlobalView shows 3 bay cards with abstract stats. A warehouse manager on the floor needs to **see the warehouse spatially** — which bay is which, which rows are hot, and where to go next. This view replaces GlobalView as the primary entry point.

Decision this view must support in <3 seconds:
- "Is there space in Bay 1 or 2 for these Bay 3 items?"
- "Which row is about to overflow?"
- "What zone is this item in?"

---

## 2. Component: `WarehouseFloorPlan.jsx`

**Replaces `GlobalView.jsx` entirely.** This is the new global view — same entry point in `App.jsx`, same prop signature. No toggle or parallel view needed.

### Props needed from parent
```js
// All already available in App.jsx
{
  getRowInventory,   // (rowId) => [{sku, qty}]
  getRowData,        // (rowId) => {row, length, lengthIn, widthFt, widthIn, type}
  skuMap,            // {[sku]: {L, W, H}}
  onRowSelect,       // (rowData) => void  — drills to RowDetailView
  onBaySelect,       // (bay) => void      — drills to BayDetailView (keep existing)
  showTooltip,       // (e, title, desc, extra) => void
  hideTooltip,       // () => void
  isSimulatedView,
  setIsSimulatedView,
  handleRunConsolidationPlan,
  consolidationResult,
  isConsolidating,
  isUpdating,
  fetchData,
  onGo3D,
}
```

---

## 3. Layout

The floor plan renders the warehouse **top-to-bottom as a manager walking from dock to back wall**. Bays are stacked vertically in physical order, not side-by-side. This matches the actual spatial experience.

```
┌─ HEADER ────────────────────────────────────────────────────────────────────┐
│  WAREHOUSE OPS  [Estado Real | Previsualización]  [3D] [Consolidar] [↺]    │
├─ SUMMARY BAR ───────────────────────────────────────────────────────────────┤
│  [HOT 12r] [WARM 9r] [COLD 16r] [BULK 1r] [STAGING 1r]  847u  3 overflows │
├─ FLOOR PLAN (scrolls vertically) ───────────────────────────────────────────┤
│                                                                              │
│  ┌── DOCK DOORS ────────────────────────────────────────────────────────┐   │
│  │  [D1]  [D2]  [D3]  [D4]                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ════ MAIN AISLE (12ft) ══════════════════════════════════════════════════  │
│                                                                              │
│  ┌── BAY 2 · Primary Logistics ─────────────────────────────────────────┐   │
│  │  ┌─[HOT]─R01──────────────────────────────── 52ft ┐                  │   │
│  │  │ ████████████████████░░░░  78%   62 u  [badge]   │                  │   │
│  │  └──────────────────────────────────────────────── ┘                  │   │
│  │  ┌─[HOT]─R02──────────────────────────────── 52ft ┐                  │   │
│  │  │ ██████░░░░░░░░░░░░░░░░░░  44%   35 u            │                  │   │
│  │  └──────────────────────────────────────────────── ┘                  │   │
│  │  · · · (rows 3–12: HOT, 52ft except R4-6 at 45ft) · · ·              │   │
│  │  ┌─[WARM]─R13───────────────────────── 45ft ┐                        │   │
│  │  │ ███░░░░░░░░░░░░░░░░░░░░░  22%   18 u      │  ← shorter row        │   │
│  │  └──────────────────────────────────────────┘                         │   │
│  │  · · · (rows 13–19, 19B: WARM) · · ·                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ════ CROSS AISLE (8ft) ══════════════════════════════════════════════════  │
│                                                                              │
│  ┌── BAY 3 · Secondary Storage ─────────────────────────────────────────┐   │
│  │  ┌─[COLD]─R20─────────────────────────────── 52ft ┐                  │   │
│  │  │ ████░░░░░░░░░░░░░░░░░░░░  31%   25 u            │                  │   │
│  │  └──────────────────────────────────────────────── ┘                  │   │
│  │  · · · (rows 20B–34: COLD, all 52ft) · · ·                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ════ BACK WALL / CROSS AISLE ════════════════════════════════════════════  │
│                                                                              │
│  ┌── BAY 1 · Bulk & Overflow ───────────────────────────────────────────┐   │
│  │  ┌─[WARM]─R41──────────────────────────────────── 60ft ┐             │   │
│  │  │ ██████████░░░░░░░░░░░░░░  55%   44 u                │             │   │
│  │  └──────────────────────────────────────────────────── ┘             │   │
│  │  ┌─[WARM]─R42──────────────────────────────────── 60ft ┐             │   │
│  │  └──────────────────────────────────────────────────── ┘             │   │
│  │  ┌─[BULK]─R43──────────────────────────────────── 65ft ──────────┐   │   │
│  │  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│   │   │
│  │  │  BLOCK STORAGE  65ft × 20ft  (no rack)  ██████ 48%  380 u   │   │   │
│  │  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│   │   │
│  │  └────────────────────────────────────────────────────────────── ┘   │   │
│  │  ┌─[WARM]─R44──────────────────────────────────── 60ft ┐             │   │
│  │  └──────────────────────────────────────────────────── ┘             │   │
│  │                                                                       │   │
│  │  · · · · · · · gap (detached staging) · · · · · · ·                  │   │
│  │                                                                       │   │
│  │  ┌─[STAGING]─R51────────────────────────────────── 60ft ┐            │   │
│  │  │  STAGING AREA  dashed border, distinct treatment      │            │   │
│  │  └─────────────────────────────────────────────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
├─ LEGEND ────────────────────────────────────────────────────────────────────┤
│  [HOT] [WARM] [COLD] [BULK] [STAGING]   ░ <70%  ▒ 70-90%  █ >90%  ● OVERFLOW│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key layout decisions

**Vertical stack (dock → back):** Bays render top-to-bottom in physical order: Bay 2 (dock-adjacent) → Bay 3 → Bay 1 (back). This matches how a manager mentally navigates the building.

**Aisle dividers:** Labeled horizontal bands between bay sections. Main aisle = thicker/brighter. Cross aisles = thinner. They are visual separators, not interactive.

**Row width proportional to length:** Within each bay, row cards scale their width proportionally to the row's actual length (in feet). Shorter rows (45ft) visibly end earlier than 52ft rows. Row 43 (65ft) is the longest. Use a base scale of `8px per foot` — so 52ft = 416px, 45ft = 360px, 65ft = 520px. This gives managers an honest spatial read.

**Row height:**
- Standard racked rows: **48px** (touch target + readability)
- Row 43 (BLOCK, 20ft wide): **96px** — double height to convey the wider footprint
- Row 51 (STAGING): **48px** but with dashed border and visual gap above it

**Bay section width:** Full available width of the container. Rows left-align within their bay section. Empty space to the right is intentional — it shows unused linear footage.

**Aisle gap sizes:**
- Main aisle (12ft): 24px gap + label `═══ MAIN AISLE · 12ft ═══`
- Cross aisles (8ft): 16px gap + label `─── CROSS AISLE · 8ft ───`
- Staging gap: 32px unlabeled gap before R51

---

## 4. Zone Color System

| Zone | Rows | Left Border | Fill bg tint | Zone chip |
|------|------|-------------|--------------|-----------|
| HOT | Bay 2: rows 1–12 | `orange-500` | `orange-500/5` | orange |
| WARM | Bay 2: rows 13–19, 19B + Bay 1: rows 41–44 | `yellow-500` | `yellow-500/5` | yellow |
| COLD | Bay 3: rows 20–34, 20B | `blue-500` | `blue-500/5` | blue |
| BULK | Row 43 only | `amber-600` | hatched pattern (see below) | amber |
| STAGING | Row 51 only | `slate-500` dashed | `slate-500/5` | slate |

Zone is indicated by a **3px left border** on each row card (always visible, never status-dependent). The subtle fill bg tint reinforces zone identity without obscuring the occupancy fill bar.

Zone chips in summary bar: `HOT · 12 rows`, `WARM · 9 rows`, `COLD · 16 rows`, `BULK · 1`, `STAGING · 1`.

**Zone assignment source:** Read `zone` field from `locations` table. The table above is the visual mapping; the data is authoritative. Fallback to `COLD` if null.

### BULK (Row 43) special visual treatment
Row 43 is open floor block storage — no racking. Render with:
- **Hatched background:** CSS `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(217,119,6,0.08) 4px, rgba(217,119,6,0.08) 8px)`
- 96px height (double standard)
- Label: `BLOCK STORAGE` in amber, secondary to row ID
- No rack-style occupancy fill — use a solid center bar showing % fill instead
- Left border: 3px solid `amber-600`
- Cursor still pointer — click drills to RowDetailView

### STAGING (Row 51) special visual treatment
- **Dashed border** on all sides: `border border-dashed border-slate-600/50`
- 32px vertical gap above (represents physical separation from main Bay 1 rows)
- Label suffix: `· STAGING` in slate/60
- Same fill bar logic as normal rows

---

## 5. Row Card Anatomy

Each row renders as a single horizontal card:

```
┌─[zone border]──────────────────────────────────────────┐
│ [fill bar behind everything, 0–100% width]             │
│ R01  52'  ████████░░░░  68%   42 units   [badges]      │
└────────────────────────────────────────────────────────┘
```

### Elements (left to right)
1. **Row label** — `R01` or `R19B`, monospace, 12px, white/60 → white on hover
2. **Dimensions** — `52'` in gray/40, 10px mono (space is limited; omit inches unless non-zero)
3. **Occupancy fill bar** — absolute positioned behind content, colored by fill level
4. **Occupancy % text** — `68%`, 11px mono, right-aligned in bar area
5. **Unit count** — `42 u`, 12px mono bold, white
6. **Badges** (right side, only when relevant):
   - `OVERFLOW` — red pill, animated pulse
   - `STALE Nd` — gray pill when `inventory.updated_at` > 7 days ago (field confirmed in DB, surfaced by task #1)
   - `ACTIVE PICK` — orange pill — **DEFERRED to v2.** `picking_lists` is order-level, not row-level; parsing JSONB items for row location is too complex for v1. Badge slot is reserved in the layout.

### Fill bar colors by occupancy level
```
< 70%   → green-500/20  (healthy — clear signal)
70–89%  → yellow-500/25 (warning — getting full)
90–99%  → red-500/25    (critical — nearly full)
≥ 100%  → red-500/35 + red border + pulse animation (overflow)
```

Occupancy % text color mirrors the fill:
```
< 70%   → green-400
70–89%  → yellow-400
90–99%  → red-400
≥ 100%  → red-500 bold
```

### Row card states
- **Default:** border-white/5, bg transparent
- **Hover:** border-orange-500/40, bg white/[0.02]
- **Overflow:** border-red-500/50, bg red-500/5
- **Active pick:** border-orange-500/60 — reserved for v2, not wired in v1
- **Click:** navigates to RowDetailView (existing behavior)

### Touch target
Row card minimum height: **48px** (tablet requirement). With padding: `py-3 px-4`.

---

## 6. Bay Column Header

```
┌─────────────────────┐
│ BAY 1               │
│ Bulk & Overflow     │
│ 5 rows · 312 units  │
│ [OVERFLOW badge]    │
└─────────────────────┘
```

- Bay name: 13px font-black uppercase
- Subtitle: 10px gray/50 mono
- Stats: 11px mono
- Overflow badge: red pill (same as row-level)
- Clicking bay header → onBaySelect (existing drill-down preserved)

---

## 7. Summary Bar

Single-row strip between header and floor plan:

```
[ HOT 12 rows ]  [ WARM 9 rows ]  [ COLD 16 rows ]  [ BULK 1 ]  [ STAGING 1 ]  |  847 units total  |  3 overflows  |  4 stale rows
```

- Zone chips: colored background matching zone color, 10px font-black uppercase
- Separators: vertical dividers (border-white/10)
- `3 overflows` → red text if >0, gray/40 otherwise
- `4 stale rows` → gray/60 text (low urgency signal)
- Active picks stat: **omitted in v1** (no row-level data available)

---

## 8. Data Requirements

### Available from existing props
- Row dimensions: `getRowData(rowId)`
- Row inventory: `getRowInventory(rowId)` → qty totals
- Overflow: `solveAutoLayout()` warnings
- Estimated capacity formula (see section 14)

### Confirmed in DB, surfaced by task #1
- `locations.zone` → HOT / WARM / COLD / BULK / STAGING per row
- `locations.max_capacity` → use instead of estimate when non-null
- `locations.picking_order` → future sort order within bay (not needed for v1)
- `inventory.updated_at` → use for staleness: show `STALE Nd` badge if > 7 days ago

### Zone resolution priority (3-tier fallback)
```js
// 1. DB field (most authoritative)
const zone = rowData.zone
  // 2. ZONE_MAP constant in InventoryData.js (warehouse-architect adding in task #6)
  ?? ZONE_MAP[rowId]
  // 3. Bay-based proxy (always works, least accurate)
  ?? (bayId === 'bay-2' ? (parseInt(rowId) <= 12 ? 'HOT' : 'WARM') : 'COLD');
```

### Deferred to v2
- **Active picks per row:** `picking_lists` is order-level; no row-level granularity without parsing JSONB. Badge slot reserved in layout, not wired.

---

## 9. Visual Hierarchy — Information Priority

1. **Overflow** (red, pulsing) — must be unmissable
2. **Occupancy fill bar** — instant gestalt read of how full each row is
3. **Unit count** — the number managers actually care about
4. **Zone color** (left border) — orientation landmark, not decision data
5. **Active pick / stale badges** — secondary, rendered only when data is available

---

## 10. Responsive Behavior

Layout is vertical (bays stacked top-to-bottom) on all breakpoints. The main concern is row card width.

### Desktop (≥1280px)
- Full proportional row widths (8px/ft). Row cards up to 520px wide.
- All metrics visible: label, dimensions, %, unit count, badges.

### Tablet (768–1279px)
- Scale rows to 6px/ft to fit narrower viewport (52ft → 312px, 65ft → 390px).
- Row dimension text hidden. Unit count + % remain. Badges: text truncated to icon dot.
- Scroll vertically. No horizontal scroll needed.

### Mobile (<768px)
- Not a priority. Rows at fixed width (100% container). Functional > beautiful.

---

## 11. Dark Theme Tokens (matches existing design system)

```
Background:       #050507 (matches BayDetailView bg)
Bay column bg:    #0f0f12 (matches GlobalView card bg)
Row default bg:   transparent / white/[0.01]
Border default:   white/5
Border hover:     orange-500/40
Text primary:     white
Text secondary:   gray/40–60
Text muted:       gray/700
Accent:           orange-500 (#f97316)
Danger:           red-500 (#ef4444)
Font:             system mono for numbers, system sans for labels
```

No new tokens needed — all match the existing design language.

---

## 12. Accessibility & Contrast

- All text on dark backgrounds meets WCAG AA for large text (warehouse use case)
- Color is never the only signal — badges always include text labels
- Focus ring on row cards: `focus-visible:ring-2 ring-orange-500`

---

## 13. What NOT to Build

- No decorative grid background patterns behind the floor plan
- No animated transitions on the fill bars on initial load (just render at correct value)
- No 3D perspective transforms on the bay cards
- No tooltips as the only source of information — if it matters, show it inline
- The floor plan is NOT a pixel-accurate blueprint — it is a schematic. Don't attempt to render aisles, exact dimensions, or forklift paths. That is for a future feature.

---

## 14. Implementation Notes for Viz-Engineer

### Row width scaling
Rows scale proportionally to their physical length. Use `8px per foot` as the base scale:
```js
const SCALE_PX_PER_FT = 8;
const rowWidthPx = rowData.length * SCALE_PX_PER_FT; // e.g. 52ft → 416px, 45ft → 360px, 65ft → 520px
```
Bay section container is full width. Rows left-align. Empty space to the right is intentional.

### Row height
```js
const rowHeightPx = rowData.type === 'block' ? 96 : 48;
```

### Row 51 staging gap
Render a 32px spacer `<div>` above Row 51 within the Bay 1 section. No label needed on the gap itself.

### Capacity
```js
// Use DB value if available, fall back to estimate
const capacity = rowData.max_capacity ?? (() => {
  const rawLengthIn = (rowData.length * 12) + (rowData.lengthIn || 0);
  const rawWidthIn = (rowData.widthFt * 12) + (rowData.widthIn || 0);
  const boxesLength = Math.floor(rawLengthIn / (DEFAULT_BOX.L + 1));
  const boxesWidth = Math.floor(rawWidthIn / (DEFAULT_BOX.W + 1));
  return boxesLength * boxesWidth * 5;
})();
```

### Overflow detection
`solveAutoLayout` is already called per-row in BayDetailView — reuse same pattern. Only import it if overflow badge is needed; skip if performance is a concern (the fill bar already communicates >100%).

### String row IDs
Row IDs may be strings: `"19B"`, `"20B"`. Format label as `R19B`. Never `parseInt` a row ID.

### Zone color lookup
```js
const ZONE_COLORS = {
  HOT:     { border: 'border-l-orange-500', bg: 'bg-orange-500/5', chip: 'bg-orange-500/20 text-orange-300' },
  WARM:    { border: 'border-l-yellow-500', bg: 'bg-yellow-500/5', chip: 'bg-yellow-500/20 text-yellow-300' },
  COLD:    { border: 'border-l-blue-500',   bg: 'bg-blue-500/5',   chip: 'bg-blue-500/20 text-blue-300' },
  BULK:    { border: 'border-l-amber-600',  bg: 'bg-amber-600/5',  chip: 'bg-amber-600/20 text-amber-300' },
  STAGING: { border: 'border-l-slate-500',  bg: 'bg-slate-500/5',  chip: 'bg-slate-500/20 text-slate-300' },
};
const zone = rowData.zone ?? 'COLD';
```

### Aisle dividers
Render as non-interactive `<div>` elements between bay sections:
```jsx
// Main aisle
<div className="flex items-center gap-3 my-4 px-2">
  <div className="flex-1 h-px bg-white/10" />
  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Main Aisle · 12ft</span>
  <div className="flex-1 h-px bg-white/10" />
</div>

// Cross aisle (thinner)
<div className="flex items-center gap-3 my-3 px-2">
  <div className="flex-1 h-px bg-white/5" />
  <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">Cross Aisle · 8ft</span>
  <div className="flex-1 h-px bg-white/5" />
</div>
```

### Routing
This component **replaces GlobalView.jsx** at the same entry point in App.jsx. Wire `onRowSelect` to navigate to RowDetailView (same behavior as BayDetailView). Wire bay section header click to `onBaySelect` (preserves existing BayDetailView drill-down path).

Swap in App.jsx: wherever `<GlobalView .../>` is rendered, render `<WarehouseFloorPlan .../>` with the same props.

---

## 15. Resolved Decisions

All open questions answered by team lead (2026-03-26):

1. **Replace GlobalView entirely.** WarehouseFloorPlan is the new global view at the same entry point.
2. **Zone resolution:** DB `locations.zone` → `ZONE_MAP` in InventoryData.js (warehouse-architect, task #6) → bay-based proxy. All three tiers implemented.
3. **Staleness:** Use `inventory.updated_at` > 7 days as STALE signal. No `last_picked_at` field exists.
4. **Active picks:** Deferred to v2. `picking_lists` is order-level only; row extraction requires JSONB parsing too complex for v1.

**Spec is FINAL. No open questions remain.**

---

## 16. JSDoc Reference Block for `WarehouseFloorPlan.jsx`

Paste this at the top of the component file:

```js
/**
 * WarehouseFloorPlan — Spatial 2D schematic of the entire warehouse.
 *
 * Replaces GlobalView as the primary entry point. Shows all 3 bays as
 * side-by-side columns with rows rendered as horizontal fill-bar cards.
 * This is a schematic (not a pixel-accurate blueprint).
 *
 * PHYSICAL LAYOUT (top = dock, bottom = back wall):
 *
 *  ┌─ HEADER ───────────────────────────────────────────────────────────┐
 *  ├─ SUMMARY BAR: zone chips | total units | overflows | picks ────────┤
 *  │                                                                     │
 *  │  [DOCK DOORS]                                                       │
 *  │  ══ MAIN AISLE · 12ft ══════════════════════════════════════════   │
 *  │  ┌─ BAY 2 · Primary Logistics ───────────────────────────────┐     │
 *  │  │  R01 [HOT]  ████████░░░░  68%  42u              ← 52ft    │     │
 *  │  │  R04 [HOT]  ████░░░░░░░░  45%  28u           ← 45ft       │     │
 *  │  │  R13 [WARM] ███░░░░░░░░░  22%  18u           ← 45ft       │     │
 *  │  │  R19B[WARM] ██████░░░░░░  55%  44u              ← 52ft    │     │
 *  │  └───────────────────────────────────────────────────────────┘     │
 *  │  ── CROSS AISLE · 8ft ──────────────────────────────────────────   │
 *  │  ┌─ BAY 3 · Secondary Storage ───────────────────────────────┐     │
 *  │  │  R20 [COLD] ████░░░░░░░░  31%  25u              ← 52ft    │     │
 *  │  │  ...                                                        │     │
 *  │  └───────────────────────────────────────────────────────────┘     │
 *  │  ── BACK WALL / CROSS AISLE ────────────────────────────────────   │
 *  │  ┌─ BAY 1 · Bulk & Overflow ─────────────────────────────────┐     │
 *  │  │  R41 [WARM] ██████░░░░░░  55%  44u              ← 60ft    │     │
 *  │  │  R43 [BULK] ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ BLOCK STORAGE 48% ← 65ft   │     │
 *  │  │             (96px tall, hatched bg, no rack)               │     │
 *  │  │  R44 [WARM] ...                                  ← 60ft    │     │
 *  │  │                                                             │     │
 *  │  │  · · · staging gap (32px) · · ·                            │     │
 *  │  │  R51 [STAGING] - - - - - - -dashed border- - -  ← 60ft    │     │
 *  │  └───────────────────────────────────────────────────────────┘     │
 *  │                                                                     │
 *  ├─ LEGEND ───────────────────────────────────────────────────────────┤
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * ROW CARD anatomy (left → right):
 *   [3px zone border] [fill bar bg] [R01] [52'] [████░░] [68%] [42 u] [badges]
 *
 * FILL BAR colors:
 *   < 70%  → green-500/20  + green-400 text
 *   70–89% → yellow-500/25 + yellow-400 text
 *   90–99% → red-500/25    + red-400 text
 *   ≥100%  → red-500/35 + red border + pulse  (OVERFLOW badge)
 *
 * ZONE border colors (left 3px accent, always visible):
 *   HOT     → orange-500   (Bay 2 rows 1–12, dock-adjacent, highest velocity)
 *   WARM    → yellow-500   (Bay 2 rows 13–19B + Bay 1 rows 41–44)
 *   COLD    → blue-500     (Bay 3 rows 20–34, secondary storage)
 *   BULK    → amber-600    (Row 43 only — block/floor storage, no rack)
 *   STAGING → slate-500    (Row 51 only — detached staging area)
 *   Zone comes from locations.zone in DB. Fallback: 'COLD'.
 *
 * LAYOUT ORDER (top → bottom, dock to back wall):
 *   [Dock Doors] → [Main Aisle 12ft] → Bay 2 → [Cross Aisle 8ft]
 *   → Bay 3 → [Back Wall] → Bay 1 (rows 41–44, gap, R51 staging)
 *
 * ROW WIDTH: proportional to physical length at 8px/ft
 *   45ft → 360px | 52ft → 416px | 60ft → 480px | 65ft → 520px
 *   Rows left-align; empty space to the right = unused linear footage.
 *
 * CAPACITY:
 *   Use locations.max_capacity from DB when available.
 *   Fallback formula: floor(lengthIn / (BOX.L+1)) * floor(widthIn / (BOX.W+1)) * 5
 *
 * BADGES (conditional, right side of row card):
 *   OVERFLOW   — red pulse — when solveAutoLayout() returns warnings
 *   ACTIVE PICK — orange  — when picking_lists has active items in row (if available)
 *   STALE Nd   — gray     — when last_picked_at > 7 days ago (if available)
 *   Omit badge entirely if data unavailable — core view must work without these.
 *
 * SPECIAL CASES:
 *   Row 43: type === 'block' — render at 96px height (vs 48px default)
 *   Row IDs may be strings: "19B", "20B" — label as "R19B", never coerce to int
 *
 * RESPONSIVE:
 *   ≥1280px: all metrics visible
 *   768–1279px: dimension text hidden, badges → colored dot only
 *   <768px: stack bays vertically, functional > beautiful
 *
 * TOUCH TARGETS: min 48px row height, 44px interactive elements (tablet floor use)
 *
 * @param {object} props
 * @param {function} props.getRowInventory  - (rowId) => [{sku, qty}]
 * @param {function} props.getRowData       - (rowId) => {row, length, lengthIn, widthFt, widthIn, type, zone, max_capacity}
 * @param {object}   props.skuMap           - {[sku]: {L, W, H}}
 * @param {function} props.onRowSelect      - (rowData) => void — drill to RowDetailView
 * @param {function} props.onBaySelect      - (bay) => void — drill to BayDetailView
 * @param {function} props.showTooltip      - (e, title, desc, extra) => void
 * @param {function} props.hideTooltip      - () => void
 * @param {boolean}  props.isSimulatedView
 * @param {function} props.setIsSimulatedView
 * @param {function} props.handleRunConsolidationPlan
 * @param {object}   props.consolidationResult
 * @param {boolean}  props.isConsolidating
 * @param {boolean}  props.isUpdating
 * @param {function} props.fetchData
 * @param {function} props.onGo3D
 */
```
