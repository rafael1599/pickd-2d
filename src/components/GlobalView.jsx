import React from 'react';
import { WAREHOUSE_STRUCTURE } from '../InventoryData';
import { solveAutoLayout } from '../engine/stackingEngine';

export function GlobalView({
    onBaySelect,
    getRowInventory,
    getRowData,
    skuMap,
    showTooltip,
    hideTooltip,
    isSimulatedView,
    setIsSimulatedView,
    handleRunConsolidationPlan,
    consolidationResult,
    isConsolidating,
    isUpdating,
    fetchData
}) {
    return (
        <div className="p-10 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
            <header className="mb-12 flex justify-between items-end border-b border-white/5 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white italic">WAREHOUSE OPS</h1>
                    <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.4em] mt-3">Strategic Distribution & Safety Stacking</p>
                </div>
                <div className="text-right flex flex-col items-end gap-6">
                    <div className="flex items-center gap-10">
                        {/* Status Info */}
                        <div>
                            <span className="text-[10px] text-orange-500 font-black block mb-1 tracking-widest">GLOBAL STATUS</span>
                            <span className="text-2xl font-mono text-white italic">ACTIVE / SECURE</span>
                        </div>

                        {/* Toggle Mode */}
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <button
                                onClick={() => setIsSimulatedView(false)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!isSimulatedView ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                            >
                                Estado Real
                            </button>
                            <button
                                onClick={() => {
                                    if (!consolidationResult) handleRunConsolidationPlan();
                                    setIsSimulatedView(true);
                                }}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isSimulatedView ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/40' : 'text-white/20 hover:text-white/40'}`}
                            >
                                Previsualización
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleRunConsolidationPlan}
                            disabled={isConsolidating || isUpdating}
                            className="px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs tracking-[0.2em] uppercase transition-all shadow-2xl shadow-orange-900/40 active:scale-95 flex items-center gap-3 group"
                        >
                            <svg className={`w-5 h-5 ${isConsolidating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {isConsolidating ? 'Analizando...' : 'Consolidar Bay 3'}
                        </button>

                        <button
                            onClick={fetchData}
                            className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-xs tracking-widest uppercase transition-all border border-white/5 flex items-center gap-2"
                        >
                            <svg className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {WAREHOUSE_STRUCTURE.bays.map(bay => {
                    const totalUnits = bay.rows.reduce((sum, rowId) => {
                        const inv = getRowInventory(rowId);
                        return sum + inv.reduce((s, i) => s + i.qty, 0);
                    }, 0);
                    const totalSkus = bay.rows.reduce((sum, rowId) => sum + (getRowInventory(rowId)).length, 0);

                    // Check if any row in this bay has an overflow
                    const bayHasOverflow = bay.rows.some(rowId => {
                        const rowData = getRowData(rowId);
                        const inv = getRowInventory(rowId);
                        const plan = solveAutoLayout(rowData, skuMap, inv);
                        return plan.warnings.length > 0;
                    });

                    return (
                        <div
                            key={bay.id}
                            onClick={() => onBaySelect(bay)}
                            onMouseEnter={(e) => showTooltip(e, bay.name, `${totalUnits} units across ${bay.rows.length} rows`, `${totalSkus} unique SKUs in section`, bayHasOverflow ? "SECTION HAS OVERFLOW EXCEPTIONS" : "")}
                            onMouseLeave={hideTooltip}
                            className={`group relative bg-[#0f0f12] border p-10 rounded-[2.5rem] transition-all duration-500 cursor-pointer overflow-hidden ${bayHasOverflow ? 'border-red-500/30 hover:shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'border-white/5 hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(249,115,22,0.1)]'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-3xl font-black text-white">{bay.name}</h3>
                                {bayHasOverflow && (
                                    <div className="bg-red-500 text-white text-[8px] font-black px-3 py-1.5 rounded-full animate-pulse uppercase tracking-wider">Exception</div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono mb-8 uppercase">{bay.rows.length} STRATEGIC ROWS</p>

                            <div className="grid grid-cols-4 gap-1 mb-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={`h-6 rounded-sm ${bayHasOverflow ? 'bg-red-500/40' : 'bg-white/20'}`} />
                                ))}
                            </div>

                            <button className="text-[10px] font-black uppercase tracking-widest text-orange-400">Manage Sections →</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
