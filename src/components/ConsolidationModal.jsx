import React from 'react';

export function ConsolidationModal({ result, isUpdating, onClose, onCommit }) {
    if (!result) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0f0f12] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-orange-600/10">
                    <div>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase relative group">
                            Plan de Consolidación
                            <span className="absolute -inset-1 bg-orange-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-white/50 text-xs font-mono mt-1">ESTRATEGIA: VACIAR BAY 3 → LLENAR BAY 1 & 2</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 transition-colors">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Items en Bay 3</div>
                            <div className="text-4xl font-mono font-bold text-white italic">{result.stats.totalItemsProposed}</div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
                            <div className="text-orange-500/50 text-[10px] font-black uppercase tracking-widest mb-1">Reubicables</div>
                            <div className="text-4xl font-mono font-bold text-orange-500 italic">{result.stats.totalItemsMoved}</div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Sin espacio</div>
                            <div className="text-4xl font-mono font-bold text-white/30 italic">{result.stats.unplacedItems}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-white/60 font-black uppercase text-xs tracking-[0.2em]">Movimientos Logísticos</h4>
                            <span className="text-[10px] font-mono text-gray-600 uppercase">Orden optimizado por cercanía</span>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {result.plan.length > 0 ? (
                                result.plan.map((move, i) => (
                                    <div key={i} className="group flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all hover:bg-white/[0.04]">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-xl italic">{move.qty}</div>
                                            <div>
                                                <div className="text-white font-black text-lg tracking-tight uppercase">{move.sku}</div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-white/20 text-[10px] font-mono font-black uppercase bg-white/5 px-2 py-0.5 rounded">DE: ROW {move.from}</span>
                                                    <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    <span className="text-orange-500/80 text-[10px] font-mono font-black uppercase bg-orange-500/10 px-2 py-0.5 rounded">A: ROW {move.to}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-white/10 font-black italic text-4xl group-hover:text-white/20 transition-colors">#{i + 1}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-white/20 italic border-2 border-dashed border-white/5 rounded-[2rem]">
                                    <p className="text-2xl font-black uppercase tracking-tighter">Sin movimientos</p>
                                    <p className="text-xs mt-2 font-mono">No hay items en Bay 3 o no hay espacio en Bay 1 y 2.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-white/10 bg-black/40 flex gap-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs transition-all border border-white/10 shadow-lg shadow-black/20"
                    >
                        Cancelar Análisis
                    </button>
                    <button
                        onClick={onCommit}
                        disabled={isUpdating || result.plan.length === 0}
                        className="flex-[2] py-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl shadow-orange-900/40 active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                        {isUpdating ? 'Transfiriendo Inventario...' : 'Confirmar y Ejecutar Consolidación'}
                    </button>
                </div>
            </div>
        </div>
    );
}
