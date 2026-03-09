import React from 'react';
import { getSkuColor } from '../rendering/colorPalette';
import { DEFAULT_BOX } from '../engine/dimensions';

export function SkuDetailPanel({ sku, inventory, skuMap, onClose, onUpdateQuantity, isUpdating }) {
    if (!sku) return null;

    // Use name normalization/trimming for better mapping
    const cleanSku = sku.trim();
    const skuInfo = skuMap[cleanSku] || skuMap[sku] || {
        L: DEFAULT_BOX.L,
        W: DEFAULT_BOX.W,
        H: DEFAULT_BOX.H,
        isDefault: true
    };

    // Safety check for individual null values
    const dims = {
        L: skuInfo.L || DEFAULT_BOX.L,
        W: skuInfo.W || DEFAULT_BOX.W,
        H: skuInfo.H || DEFAULT_BOX.H
    };

    const quantity = inventory.find(i => i.sku === sku)?.qty || 0;
    const rawLocation = inventory.find(i => i.sku === sku)?.rawLocation || '';

    return (
        <div className="flex-1 max-w-sm h-full bg-[#0a0a0c] border border-white/5 rounded-3xl p-8 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 shadow-2xl">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest block mb-2">Item Detailed Intel</span>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none">{sku}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/5 text-gray-600 hover:text-white transition-all"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
                {/* Visual Representation */}
                <div className="relative h-40 bg-white/[0.02] rounded-[2rem] border border-white/5 flex items-center justify-center group overflow-hidden">
                    <div
                        className="w-24 h-24 rounded-2xl shadow-2xl transform group-hover:scale-110 transition-transform duration-700"
                        style={{ backgroundColor: getSkuColor(sku, 0.8), border: `4px solid ${getSkuColor(sku, 1)}` }}
                    />
                    <div className="absolute inset-x-0 bottom-4 text-center">
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Neural Visualization</span>
                    </div>
                </div>

                {/* Dimensional Specs */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center pr-1">
                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest pl-1">Engine Specifications</span>
                        {skuInfo.isDefault && (
                            <span className="text-[8px] bg-red-500/10 text-red-500 font-black px-2 py-1 rounded-md uppercase tracking-widest">Missing Specs</span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <SpecBlock label="Length" value={`${dims.L}"`} />
                        <SpecBlock label="Width" value={`${dims.W}"`} />
                        <SpecBlock label="Height" value={`${dims.H}"`} />
                    </div>
                </div>

                {/* Notes Section */}
                {skuInfo.note && (
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6">
                        <span className="text-[9px] text-orange-500/60 font-black uppercase tracking-widest block mb-3">Operational Notes</span>
                        <p className="text-sm text-white/80 leading-relaxed font-medium italic">"{skuInfo.note}"</p>
                    </div>
                )}

                {/* Inventory Controls */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Active Stock</span>
                        <span className="text-4xl font-mono font-black text-white">{quantity}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            disabled={isUpdating}
                            onClick={() => onUpdateQuantity(sku, rawLocation, Math.max(0, quantity - 1))}
                            className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white border border-white/10 transition-all active:scale-95"
                        >-</button>
                        <button
                            disabled={isUpdating}
                            onClick={() => onUpdateQuantity(sku, rawLocation, quantity + 1)}
                            className="flex-1 h-14 rounded-2xl bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-900/20 transition-all active:scale-95"
                        >+</button>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 text-[9px] font-mono text-gray-600 uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Secure Data Connection: ROW {rawLocation.replace('ROW ', '')}
                </div>
            </div>
        </div>
    );
}

function SpecBlock({ label, value }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <span className="text-[8px] text-gray-600 font-black uppercase block mb-1">{label}</span>
            <span className="text-sm font-mono font-black text-white">{value}</span>
        </div>
    );
}
