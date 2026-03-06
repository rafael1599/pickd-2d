import React, { useState } from 'react';
import WarehouseD3Visualizer from './WarehouseD3Visualizer';
import { SkuDetailPanel } from './SkuDetailPanel';
import { StatCard } from './Common';

export function RowDetailView({
    currentRowData,
    rowPlan,
    selectedBay,
    skuMap,
    onGoBackGlobal,
    onGoBackBay,
    onUpdateDimensions,
    onUpdateQuantity,
    isUpdating,
    showTooltip,
    hideTooltip,
    inventory
}) {
    const [selectedSku, setSelectedSku] = useState(null);

    const totalPlaced = rowPlan?.placements.length || 0;
    const totalOverflow = rowPlan?.warnings.length > 0;

    return (
        <div className="h-full bg-[#050507] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
            <div className="px-10 py-10 bg-black/40 border-b border-orange-500/10 z-20 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onGoBackGlobal} className="text-[10px] font-black text-gray-600 hover:text-white transition-colors uppercase">Warehouse</button>
                    <span className="text-gray-800">/</span>
                    <button onClick={onGoBackBay} className="text-[10px] font-black text-gray-600 hover:text-white transition-colors uppercase">{selectedBay?.name}</button>
                    <span className="text-gray-800">/</span>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">ROW {currentRowData.row.toString().padStart(2, '0')} INTERACTIVE PLANNER</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Editable Dimensions */}
                    <div className="border-l border-white/10 pl-4">
                        <span className="text-[9px] text-gray-500 font-black uppercase block mb-2">Physical Size (Blueprint)</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 group">
                                <input
                                    type="number"
                                    value={currentRowData.length || 0}
                                    onChange={(e) => onUpdateDimensions(currentRowData.row, 'length', parseInt(e.target.value) || 0)}
                                    className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 font-mono text-lg font-black text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                                <span className="text-[10px] text-gray-500 font-black">FT</span>
                                <input
                                    type="number"
                                    value={currentRowData.lengthIn || 0}
                                    onChange={(e) => onUpdateDimensions(currentRowData.row, 'lengthIn', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1 font-mono text-lg font-black text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                                <span className="text-[10px] text-gray-500 font-black">IN</span>
                            </div>
                            <span className="text-orange-500 px-2 font-black italic opacity-40">×</span>
                            <div className="flex items-center gap-1 group">
                                <input
                                    type="number"
                                    value={currentRowData.widthFt || 0}
                                    onChange={(e) => onUpdateDimensions(currentRowData.row, 'widthFt', parseInt(e.target.value) || 0)}
                                    className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1 font-mono text-lg font-black text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                                <span className="text-[10px] text-gray-500 font-black">FT</span>
                            </div>
                        </div>
                    </div>

                    <StatCard label="Current Load" value={`${totalPlaced} Units`} color={totalOverflow ? "text-red-500" : "text-white"} />
                    <StatCard label="Layout Algorithm" value="Auto-Solver v2" color="text-green-500" />
                    <StatCard label="Status" value={totalOverflow ? "SPACE OVERFLOW" : "OPTIMIZED"} color={totalOverflow ? "text-red-500" : "text-gray-400"} />
                </div>
            </div>

            <div className="flex-1 bg-[#020202] p-6 flex gap-6 overflow-hidden">
                {/* Main Canvas Area */}
                <div className="flex-[3] h-full shadow-2xl relative border border-white/5 rounded-2xl overflow-hidden">
                    {totalOverflow && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white px-8 py-4 rounded-2xl shadow-2xl border border-red-500/50 backdrop-blur-md text-sm font-black flex flex-col items-center animate-in zoom-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="uppercase tracking-widest text-[10px]">Row Depth Exception</span>
                            </div>
                            <span className="text-white/80 font-mono mt-2 text-[11px] text-center">{rowPlan.warnings[0]}</span>
                        </div>
                    )}
                    <WarehouseD3Visualizer
                        rowData={currentRowData}
                        placements={rowPlan.placements}
                        groups={rowPlan.groups}
                        skuMap={skuMap}
                        onHoverItem={showTooltip}
                        onLeaveItem={hideTooltip}
                        onClickItem={(group) => setSelectedSku(group.sku)}
                    />
                </div>

                {/* Sku Intel Panel (replacing Live Inventory table) */}
                {selectedSku ? (
                    <SkuDetailPanel
                        sku={selectedSku}
                        skuMap={skuMap}
                        inventory={inventory}
                        onClose={() => setSelectedSku(null)}
                        onUpdateQuantity={onUpdateQuantity}
                        isUpdating={isUpdating}
                    />
                ) : (
                    <div className="flex-1 max-w-sm h-full bg-[#0a0a0c]/40 border border-white/5 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center opacity-40">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2">Item Intel Access</h3>
                        <p className="text-[10px] font-mono text-gray-600 leading-relaxed">SELECT A BOX OR UNIT IN THE 2D VIEW TO RETRIEVE DETAILED SPECIFICATIONS & INVENTORY CONTROLS</p>
                    </div>
                )}
            </div>
        </div>
    );
}
