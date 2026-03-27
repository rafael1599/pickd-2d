import React, { useMemo } from 'react';
import { WAREHOUSE_STRUCTURE, ZONE_MAP } from '../InventoryData';
import { DEFAULT_BOX } from '../engine/dimensions';
import { solveAutoLayout } from '../engine/stackingEngine';

/**
 * WarehouseFloorPlan — Spatial 2D schematic of the entire warehouse.
 *
 * Replaces GlobalView as the primary entry point. Shows all 3 bays as
 * vertical sections stacked top-to-bottom (dock → back wall).
 * This is a schematic (not a pixel-accurate blueprint).
 *
 * PHYSICAL LAYOUT (top = dock, bottom = back wall):
 *
 *  ┌─ HEADER ───────────────────────────────────────────────────────────┐
 *  ├─ SUMMARY BAR: zone chips | total units | overflows | stale ────────┤
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
 *  │  └───────────────────────────────────────────────────────────┘     │
 *  │  ── BACK WALL / CROSS AISLE ────────────────────────────────────   │
 *  │  ┌─ BAY 1 · Bulk & Overflow ─────────────────────────────────┐     │
 *  │  │  R41 [WARM] ██████░░░░░░  55%  44u              ← 60ft    │     │
 *  │  │  R43 [BULK] ▒▒▒▒ BLOCK STORAGE 48%              ← 65ft   │     │
 *  │  │  R44 [WARM] ...                                  ← 60ft    │     │
 *  │  │  · · · staging gap (32px) · · ·                            │     │
 *  │  │  R51 [STAGING] - - dashed - -                   ← 60ft    │     │
 *  │  └───────────────────────────────────────────────────────────┘     │
 *  │                                                                     │
 *  ├─ LEGEND ───────────────────────────────────────────────────────────┤
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * ROW WIDTH: proportional to physical length at 8px/ft
 *   45ft → 360px | 52ft → 416px | 60ft → 480px | 65ft → 520px
 *
 * FILL BAR colors:
 *   < 70%  → green-500/20  + green-400 text
 *   70–89% → yellow-500/25 + yellow-400 text
 *   90–99% → red-500/25    + red-400 text
 *   ≥100%  → red-500/35 + red border + pulse  (OVERFLOW badge)
 *
 * ZONE border colors (left 3px accent, always visible):
 *   HOT     → orange-500, WARM → yellow-500, COLD → blue-500
 *   BULK    → amber-600 (Row 43 — block storage, hatched bg, 96px)
 *   STAGING → slate-500 dashed (Row 51 — detached, 32px gap above)
 *
 * @param {object} props
 * @param {function} props.getRowInventory  - (rowId) => [{sku, qty, updatedAt}]
 * @param {function} props.getRowData       - (rowId) => {row, length, lengthIn, widthFt, widthIn, type, zone, maxCapacity}
 * @param {object}   props.skuMap           - {[sku]: {L, W, H}}
 * @param {function} props.onRowSelect      - (rowData) => void
 * @param {function} props.onBaySelect      - (bay) => void
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

// Physical order: dock → back wall
const BAY_ORDER = ['bay-2', 'bay-3', 'bay-1'];

const SCALE_PX_PER_FT = 8;

/** @type {Record<string, {border: string, bg: string, chip: string}>} */
const ZONE_COLORS = {
    HOT:     { border: 'border-l-orange-500', bg: 'bg-orange-500/5',  chip: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    WARM:    { border: 'border-l-yellow-500', bg: 'bg-yellow-500/5',  chip: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    COLD:    { border: 'border-l-blue-500',   bg: 'bg-blue-500/5',    chip: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    BULK:    { border: 'border-l-amber-600',  bg: 'bg-amber-600/5',   chip: 'bg-amber-600/20 text-amber-300 border-amber-600/30' },
    STAGING: { border: 'border-l-slate-500',  bg: 'bg-slate-500/5',   chip: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

/** 3-tier zone resolution: DB → ZONE_MAP → bay proxy */
function resolveZone(rowId, bayId, dbZone) {
    if (dbZone && dbZone !== 'UNASSIGNED') return dbZone;
    if (ZONE_MAP[rowId]) return ZONE_MAP[rowId];
    if (bayId === 'bay-2') return parseInt(rowId) <= 12 ? 'HOT' : 'WARM';
    return 'COLD';
}

/** @param {number} pct */
function occupancyStyle(pct) {
    if (pct >= 100) return { fill: 'bg-red-500/35',    text: 'text-red-500 font-black' };
    if (pct >= 90)  return { fill: 'bg-red-500/25',    text: 'text-red-400' };
    if (pct >= 70)  return { fill: 'bg-yellow-500/25', text: 'text-yellow-400' };
    return                  { fill: 'bg-green-500/20', text: 'text-green-400' };
}

function computeCapacity(rowData) {
    if (rowData?.maxCapacity) return rowData.maxCapacity;
    if (!rowData) return 1;
    const rawLengthIn = (rowData.length * 12) + (rowData.lengthIn || 0);
    const rawWidthIn  = (rowData.widthFt  * 12) + (rowData.widthIn  || 0);
    return Math.max(1, Math.floor(rawLengthIn / (DEFAULT_BOX.L + 1)) * Math.floor(rawWidthIn / (DEFAULT_BOX.W + 1)) * 5);
}

function rowLabel(rowId) {
    if (typeof rowId === 'number') return `R${String(rowId).padStart(2, '0')}`;
    return `R${rowId}`;
}

function dimLabel(rowData) {
    if (!rowData) return '';
    const inches = rowData.lengthIn || 0;
    return inches > 0 ? `${rowData.length}'${inches}"` : `${rowData.length}'`;
}

export function WarehouseFloorPlan({
    getRowInventory,
    getRowData,
    skuMap,
    onRowSelect,
    onBaySelect,
    showTooltip,
    hideTooltip,
    isSimulatedView,
    setIsSimulatedView,
    handleRunConsolidationPlan,
    consolidationResult,
    isConsolidating,
    isUpdating,
    fetchData,
    onGo3D,
    rowActivityMap = {},
}) {
    const bayMap = useMemo(() => {
        const m = {};
        WAREHOUSE_STRUCTURE.bays.forEach(b => { m[b.id] = b; });
        return m;
    }, []);

    const rowStats = useMemo(() => {
        const now = Date.now();
        const stats = {};
        WAREHOUSE_STRUCTURE.bays.forEach(bay => {
            bay.rows.forEach(rowId => {
                const rowData    = getRowData(rowId);
                const inv        = getRowInventory(rowId);
                const totalUnits = inv.reduce((s, i) => s + i.qty, 0);
                const capacity   = computeCapacity(rowData);
                const pct        = (totalUnits / capacity) * 100;
                const plan       = solveAutoLayout(rowData, skuMap, inv);
                const isOverflow = plan.warnings.length > 0;
                const zone       = resolveZone(rowId, bay.id, rowData?.zone);

                // Activity data — prefer inventory_logs RPC, fall back to inventory.updatedAt
                const activity = rowActivityMap[rowId];
                const movementCount7d  = activity?.movementCount7d  ?? 0;
                const movementCount30d = activity?.movementCount30d ?? 0;

                let lastTouchedMs = activity?.lastTouchedAt
                    ? new Date(activity.lastTouchedAt).getTime()
                    : null;

                // Fallback: derive from inventory items' updatedAt if no log data
                if (!lastTouchedMs) {
                    inv.forEach(item => {
                        if (item.updatedAt) {
                            const t = new Date(item.updatedAt).getTime();
                            if (!lastTouchedMs || t > lastTouchedMs) lastTouchedMs = t;
                        }
                    });
                }

                const staleDays = (lastTouchedMs && totalUnits > 0)
                    ? Math.floor((now - lastTouchedMs) / (24 * 60 * 60 * 1000))
                    : null;

                stats[rowId] = {
                    totalUnits, capacity, pct, isOverflow, zone, rowData, inv,
                    staleDays, isStale: staleDays !== null && staleDays > 7,
                    movementCount7d, movementCount30d,
                };
            });
        });
        return stats;
    }, [getRowData, getRowInventory, skuMap, rowActivityMap]);

    const summary = useMemo(() => {
        let totalUnits = 0, overflowCount = 0, staleCount = 0;
        const zoneCounts = {};
        Object.values(rowStats).forEach(s => {
            totalUnits += s.totalUnits;
            if (s.isOverflow) overflowCount++;
            if (s.isStale) staleCount++;
            zoneCounts[s.zone] = (zoneCounts[s.zone] || 0) + 1;
        });
        return { totalUnits, overflowCount, staleCount, zoneCounts };
    }, [rowStats]);

    const orderedBays = BAY_ORDER.map(id => bayMap[id]).filter(Boolean);

    return (
        <div className="flex flex-col h-full bg-[#050507] text-white overflow-hidden">
            {/* HEADER */}
            <header className="px-6 py-5 flex flex-wrap justify-between items-center gap-4 border-b border-white/5 bg-black/30 backdrop-blur-xl shrink-0">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white italic leading-none">WAREHOUSE OPS</h1>
                    <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.35em] mt-1">Spatial Floor Plan · Dock → Back Wall</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setIsSimulatedView(false)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isSimulatedView ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                        >
                            Estado Real
                        </button>
                        <button
                            onClick={() => { if (!consolidationResult) handleRunConsolidationPlan(); setIsSimulatedView(true); }}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isSimulatedView ? 'bg-orange-600 text-white' : 'text-white/20 hover:text-white/40'}`}
                        >
                            Previsualización
                        </button>
                    </div>
                    <button
                        onClick={onGo3D}
                        className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        3D
                    </button>
                    <button
                        onClick={handleRunConsolidationPlan}
                        disabled={isConsolidating || isUpdating}
                        className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${isConsolidating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {isConsolidating ? 'Analizando...' : 'Consolidar Bay 3'}
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={isUpdating}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all border border-white/5"
                        title="Refresh"
                    >
                        <svg className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* SUMMARY BAR */}
            <div className="px-6 py-2.5 flex flex-wrap items-center gap-3 border-b border-white/5 bg-black/20 shrink-0">
                {['HOT', 'WARM', 'COLD', 'BULK', 'STAGING'].map(zone => {
                    const count = summary.zoneCounts[zone];
                    if (!count) return null;
                    const c = ZONE_COLORS[zone];
                    return (
                        <span key={zone} className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${c.chip}`}>
                            {zone} · {count}
                        </span>
                    );
                })}
                <div className="w-px h-4 bg-white/10 mx-1" />
                <span className="text-white font-mono text-xs font-black">
                    {summary.totalUnits.toLocaleString()} <span className="text-white/30 font-normal">units</span>
                </span>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <span className={`font-mono text-xs font-black ${summary.overflowCount > 0 ? 'text-red-400' : 'text-white/20'}`}>
                    {summary.overflowCount} <span className="font-normal">overflow{summary.overflowCount !== 1 ? 's' : ''}</span>
                </span>
                {summary.staleCount > 0 && (
                    <>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <span className="font-mono text-xs text-white/40">
                            {summary.staleCount} <span className="font-normal">stale</span>
                        </span>
                    </>
                )}
            </div>

            {/* FLOOR PLAN */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6">
                <DockDoors />
                <AisleDivider label="Main Aisle · 12ft" thick />

                {orderedBays.map((bay, idx) => (
                    <React.Fragment key={bay.id}>
                        <BaySection
                            bay={bay}
                            rowStats={rowStats}
                            onRowSelect={onRowSelect}
                            onBaySelect={onBaySelect}
                            showTooltip={showTooltip}
                            hideTooltip={hideTooltip}
                        />
                        {idx === 0 && <AisleDivider label="Cross Aisle · 8ft" />}
                        {idx === 1 && <AisleDivider label="Back Wall / Cross Aisle" />}
                    </React.Fragment>
                ))}
            </div>

            {/* LEGEND */}
            <footer className="px-6 py-3 border-t border-white/5 bg-black/20 shrink-0 flex flex-wrap items-center gap-5 text-[10px] font-mono text-white/30">
                <span className="font-black text-white/20 uppercase tracking-widest">Legend</span>
                <div className="flex items-center gap-3">
                    {[['bg-orange-500', 'HOT'], ['bg-yellow-500', 'WARM'], ['bg-blue-500', 'COLD'], ['bg-amber-600', 'BULK'], ['bg-slate-500', 'STAGING']].map(([color, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 ${color} rounded-sm`} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-3">
                    {[['bg-green-500/40', '<70%'], ['bg-yellow-500/40', '70–89%'], ['bg-red-500/40', '>90%']].map(([color, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-5 h-2.5 ${color} rounded-sm`} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
                <div className="w-px h-3 bg-white/10" />
                <span><span className="text-red-400 font-black">OVERFLOW</span> = stacking warns</span>
                <span><span className="text-gray-400 font-black">STALE</span> = no activity &gt;7d</span>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span>active (moves in 7d)</span></div>
            </footer>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DockDoors() {
    return (
        <div className="mb-4 px-3 py-3 rounded-lg border border-white/5 bg-white/[0.01]">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">Dock Doors</div>
            <div className="flex gap-3">
                {['D1', 'D2', 'D3', 'D4'].map(d => (
                    <div key={d} className="px-4 py-2 border border-white/10 rounded text-[10px] font-mono font-black text-white/30 bg-white/[0.02]">
                        {d}
                    </div>
                ))}
            </div>
        </div>
    );
}

function AisleDivider({ label, thick = false }) {
    if (thick) {
        return (
            <div className="flex items-center gap-3 my-4 px-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest whitespace-nowrap">{label}</span>
                <div className="flex-1 h-px bg-white/10" />
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3 my-3 px-2">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-white/5" />
        </div>
    );
}

function BaySection({ bay, rowStats, onRowSelect, onBaySelect, showTooltip, hideTooltip }) {
    const bayTotalUnits = bay.rows.reduce((sum, rowId) => sum + (rowStats[rowId]?.totalUnits || 0), 0);
    const bayHasOverflow = bay.rows.some(rowId => rowStats[rowId]?.isOverflow);

    return (
        <div className="bg-[#0f0f12] rounded-xl border border-white/5 overflow-hidden">
            <button
                onClick={() => onBaySelect(bay)}
                className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[13px] font-black uppercase text-white">
                            {bay.name.split('(')[0].trim()}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                            {bay.name.match(/\(([^)]+)\)/)?.[1] || ''}
                        </span>
                        <span className="text-[11px] font-mono text-white/30">
                            {bay.rows.length} rows · {bayTotalUnits.toLocaleString()} units
                        </span>
                    </div>
                    {bayHasOverflow && (
                        <span className="shrink-0 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse uppercase tracking-wider">
                            OVERFLOW
                        </span>
                    )}
                </div>
            </button>

            <div className="flex flex-col gap-0.5 p-2">
                {bay.rows.map((rowId, idx) => {
                    const isStaging = rowId === 51;
                    const prevRowId = bay.rows[idx - 1];
                    return (
                        <React.Fragment key={rowId}>
                            {isStaging && prevRowId !== 51 && <div style={{ height: 32 }} />}
                            <RowCard
                                rowId={rowId}
                                stats={rowStats[rowId]}
                                onRowSelect={onRowSelect}
                                showTooltip={showTooltip}
                                hideTooltip={hideTooltip}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

function RowCard({ rowId, stats, onRowSelect, showTooltip, hideTooltip }) {
    if (!stats) return null;
    const { totalUnits, capacity, pct, isOverflow, zone, rowData, inv, staleDays, isStale, movementCount7d, movementCount30d } = stats;
    const isBlock   = rowData?.type === 'block';
    const isStaging = rowId === 51;
    const zc        = ZONE_COLORS[zone] || ZONE_COLORS.COLD;
    const os        = occupancyStyle(pct);
    const fillPct   = Math.min(100, Math.max(0, pct));
    const rowWidthPx = (rowData?.length || 52) * SCALE_PX_PER_FT;

    // Activity pulse: any movement in last 7 days = active
    const isActive = movementCount7d > 0;

    const handleMouseEnter = (e) => {
        const topSkus = [...(inv || [])]
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 3)
            .map(i => `${i.sku} ×${i.qty}`)
            .join(', ');
        const activityStr = movementCount30d > 0
            ? `${movementCount7d} moves (7d) · ${movementCount30d} moves (30d)`
            : null;
        showTooltip(
            e,
            `Row ${rowId}${isBlock ? ' (BLOCK STORAGE)' : isStaging ? ' (STAGING)' : ''}`,
            `${totalUnits} / ~${capacity} units · ${Math.round(pct)}% full · Zone: ${zone}`,
            [
                dimLabel(rowData) ? `${dimLabel(rowData)} × ${rowData?.widthFt || '?'}'` : '',
                topSkus ? `Top SKUs: ${topSkus}` : '',
                activityStr || (staleDays !== null ? `Last activity: ${staleDays}d ago` : ''),
                isOverflow ? 'OVERFLOW — stacking engine warnings' : '',
            ].filter(Boolean).join(' | ')
        );
    };

    // BULK (Row 43) — hatched, double height, center fill bar
    if (isBlock) {
        return (
            <button
                onClick={() => rowData && onRowSelect(rowData)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={hideTooltip}
                style={{
                    width: rowWidthPx,
                    minHeight: 96,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(217,119,6,0.08) 4px, rgba(217,119,6,0.08) 8px)',
                }}
                className="relative text-left overflow-hidden rounded-lg border-l-[3px] border-l-amber-600 border-t border-r border-b border-amber-600/20 transition-all focus-visible:ring-2 focus-visible:ring-orange-500 hover:border-amber-500/40"
            >
                {/* Center fill bar */}
                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-8 rounded overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 ${os.fill} rounded`} style={{ width: `${fillPct}%` }} />
                </div>
                <div className="relative z-10 flex flex-col justify-between px-3 py-2" style={{ minHeight: 96 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-black text-amber-300">{rowLabel(rowId)}</span>
                            <span className="text-[10px] font-mono text-amber-500/70 uppercase tracking-wider">Block Storage</span>
                            <span className="hidden lg:block text-[10px] font-mono text-white/25">{dimLabel(rowData)} × {rowData?.widthFt}'</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {isActive && !isOverflow && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shrink-0" title={`${movementCount7d} moves in last 7 days`} />}
                            {isOverflow && <span className="hidden lg:inline-flex bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">OVERFLOW</span>}
                            {isStale && <span className="hidden lg:inline-flex bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">STALE {staleDays}d</span>}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <span className={`text-[11px] font-mono ${os.text}`}>{Math.round(pct)}%</span>
                        <span className="text-[12px] font-mono font-black text-white">
                            {totalUnits.toLocaleString()} <span className="text-white/30 font-normal text-[10px]">u</span>
                        </span>
                    </div>
                </div>
            </button>
        );
    }

    // Overflow always wins visually; staging dashed border only when not overflowing
    const borderClass = isOverflow
        ? 'border-t border-r border-b border-red-500/50 bg-red-500/5'
        : isStaging
            ? 'border border-dashed border-slate-600/50 hover:border-slate-500/60 hover:bg-white/[0.02]'
            : 'border-t border-r border-b border-white/5 hover:border-orange-500/40 hover:bg-white/[0.02]';

    return (
        <button
            onClick={() => rowData && onRowSelect(rowData)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={hideTooltip}
            style={{ width: rowWidthPx, minHeight: 48 }}
            className={[
                'relative text-left overflow-hidden rounded-lg border-l-[3px] transition-all focus-visible:ring-2 focus-visible:ring-orange-500',
                zc.border,
                zc.bg,
                borderClass,
            ].join(' ')}
        >
            {/* Occupancy fill bar */}
            <div
                className={`absolute inset-y-0 left-0 ${os.fill} ${isOverflow ? 'animate-pulse' : ''} pointer-events-none`}
                style={{ width: `${fillPct}%` }}
            />
            {/* Content */}
            <div className="relative z-10 flex items-center gap-2 px-3 py-2 h-full min-h-[48px]">
                <span className="text-[11px] font-mono font-black text-white/60 w-9 shrink-0">{rowLabel(rowId)}</span>
                {isStaging && <span className="text-[9px] font-mono text-slate-500/70 uppercase tracking-wider shrink-0">Staging</span>}
                <span className="hidden lg:block text-[10px] font-mono text-white/25 w-10 shrink-0">{dimLabel(rowData)}</span>
                <div className="flex-1" />
                <span className={`text-[11px] font-mono ${os.text} w-10 text-right shrink-0`}>{Math.round(pct)}%</span>
                <span className="text-[12px] font-mono font-black text-white w-14 text-right shrink-0">
                    {totalUnits.toLocaleString()} <span className="text-white/30 font-normal text-[10px]">u</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {isActive && !isOverflow && (
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shrink-0" title={`${movementCount7d} moves in last 7 days`} />
                    )}
                    {isOverflow && (
                        <>
                            <span className="hidden lg:inline-flex bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">OVERFLOW</span>
                            <span className="lg:hidden w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                        </>
                    )}
                    {isStale && (
                        <>
                            <span className="hidden lg:inline-flex bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">STALE {staleDays}d</span>
                            <span className="lg:hidden w-2 h-2 bg-gray-500/60 rounded-full shrink-0" />
                        </>
                    )}
                </div>
            </div>
        </button>
    );
}
