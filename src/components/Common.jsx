import React from 'react';

export function Tooltip({ tooltip }) {
    if (!tooltip.visible) return null;
    return (
        <div
            className="fixed bottom-6 left-6 z-[9999] pointer-events-none p-10 rounded-2xl border border-white/10 bg-[#0a0a0c]/95 backdrop-blur-xl shadow-2xl min-w-[480px] animate-in slide-in-from-left-4 duration-300"
        >
            <div className="text-[20px] font-black uppercase tracking-widest text-orange-500 mb-3">{tooltip.title}</div>
            <div className="text-[28px] font-semibold text-white leading-snug">{tooltip.desc}</div>
            {tooltip.extra && <div className="text-[18px] font-mono text-white/40 mt-6 border-t border-white/10 pt-6 space-y-2 whitespace-pre-line">{tooltip.extra}</div>}
        </div>
    );
}

export function StatCard({ label, value, color = "text-white" }) {
    return (
        <div className="border-l border-white/10 pl-4">
            <span className="text-[9px] text-gray-500 font-black uppercase block mb-1">{label}</span>
            <span className={`text-xl font-mono font-black ${color}`}>{value}</span>
        </div>
    );
}
