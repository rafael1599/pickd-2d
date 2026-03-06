import React from 'react';
import { DEFAULT_BOX } from '../engine/dimensions';
import { solveAutoLayout } from '../engine/stackingEngine';

export function BayDetailView({
    selectedBay,
    onGoBack,
    getRowData,
    getRowInventory,
    onRowSelect,
    skuMap,
    showTooltip,
    hideTooltip,
    scale
}) {
    return (
        <div className="flex flex-col h-full bg-[#050507] animate-in slide-in-from-right duration-500">
            <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onGoBack} className="text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase">Warehouse</button>
                    <span className="text-gray-800">/</span>
                    <h2 className="text-sm font-black text-orange-500 uppercase tracking-widest leading-none">{selectedBay.name}</h2>
                </div>
            </div>

            <div className="flex-1 p-20 overflow-auto bg-[#08080a] custom-scrollbar">
                <div className="max-w-5xl mx-auto flex flex-col gap-4">
                    {selectedBay.rows.map(rowId => {
                        const rowData = getRowData(rowId);
                        const inv = getRowInventory(rowId);
                        const totalUnits = inv.reduce((sum, i) => sum + i.qty, 0);

                        const rawLengthIn = (rowData.length * 12) + (rowData.lengthIn || 0);
                        const rawWidthIn = (rowData.widthFt * 12) + (rowData.widthIn || 0);

                        const boxesLength = Math.floor(rawLengthIn / (DEFAULT_BOX.L + 1));
                        const boxesWidth = Math.floor(rawWidthIn / (DEFAULT_BOX.W + 1));
                        const estCapacity = boxesLength * boxesWidth * 5;

                        const occupancy = estCapacity > 0 ? (totalUnits / estCapacity) * 100 : 0;

                        const plan = solveAutoLayout(rowData, skuMap, inv);
                        const isOverflowing = plan.warnings.length > 0;

                        return (
                            <div
                                key={rowId}
                                onClick={() => onRowSelect(rowData)}
                                onMouseEnter={(e) => showTooltip(e, `Row ${rowId}`, `${totalUnits} / ~${estCapacity} units (${Math.round(occupancy)}%)`, `${inv.length} SKUs · ${rowData.length}'${rowData.lengthIn || 0}" x ${rowData.widthFt}'`)}
                                onMouseLeave={hideTooltip}
                                className={`group relative flex items-center h-16 border rounded-lg overflow-hidden transition-all cursor-pointer ${isOverflowing ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-orange-500/30'}`}
                                style={{ width: `${Math.max(100, (rowData.length * 12 + (rowData.lengthIn || 0)) * (scale / 8))}px` }}
                            >
                                <div className={`absolute -left-12 text-[10px] font-mono font-black ${isOverflowing ? 'text-red-500' : 'text-gray-700'}`}>R{rowId}</div>
                                <div className={`absolute left-0 top-0 h-full transition-all duration-1000 ${isOverflowing ? 'bg-red-500/20' : 'bg-orange-500/10'}`} style={{ width: `${Math.min(100, Math.max(0, occupancy))}%` }} />
                                <div className="relative z-10 w-full px-6 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black italic transition-colors uppercase ${isOverflowing ? 'text-red-400' : 'text-white/20 group-hover:text-white/60'}`}>
                                            {rowData.length}'{rowData.lengthIn || 0}" LINEAR
                                        </span>
                                        {isOverflowing && (
                                            <svg className="w-3 h-3 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`font-mono text-xs font-black ${isOverflowing ? 'text-red-500' : 'text-orange-400'}`}>{totalUnits}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
