import React, { useRef, useEffect, useState, useMemo } from 'react';
import { drawRow } from '../rendering/canvasRenderer';

export function WarehouseCanvas({ rowData, placements, groups, skuMap, baseScale = 2, onHoverItem, onLeaveItem, onClickItem }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Viewport transform state for panning & zooming
    const [scale, setScale] = useState(baseScale);
    const [offset, setOffset] = useState({ x: 50, y: 50 }); // Padding
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredGroupId, setHoveredGroupId] = useState(null);

    // Compute UI bounding boxes for tooltip hit-testing
    const groupBounds = useMemo(() => {
        if (!groups) return {};
        const bounds = {};
        placements.forEach(p => {
            if (!p.groupId) return;
            const pxX = p.y * scale;
            const pxY = p.x * scale;
            const pxW = p.l * scale;
            const pxH = p.w * scale;

            if (!bounds[p.groupId]) {
                bounds[p.groupId] = {
                    minX: pxX, minY: pxY, maxX: pxX + pxW, maxY: pxY + pxH,
                    groupData: groups[p.groupId]
                };
            } else {
                const b = bounds[p.groupId];
                b.minX = Math.min(b.minX, pxX);
                b.minY = Math.min(b.minY, pxY);
                b.maxX = Math.max(b.maxX, pxX + pxW);
                b.maxY = Math.max(b.maxY, pxY + pxH);
            }
        });
        return bounds;
    }, [placements, groups, scale]);

    // Handle Resize to keep canvas sharp
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            // Set canvas visual size to match container perfectly
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            // Set actual internal bitmap resolution (support Retina/HiDPI displays)
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            renderFrame();
        };

        const handleWheel = (e) => {
            e.preventDefault();
            const zoomIntensity = 0.1;
            const wheel = e.deltaY < 0 ? 1 : -1;
            let newScale = scale + (wheel * zoomIntensity * scale);
            newScale = Math.min(Math.max(0.5, newScale), 10);
            setScale(newScale);
        };

        const container = containerRef.current;
        window.addEventListener('resize', resizeCanvas);
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [rowData, placements, scale, offset, hoveredGroupId]);

    // Draw the scene
    const renderFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save clean state
        ctx.save();

        // Apply Drag/Pan Translation
        ctx.translate(offset.x, offset.y);

        // The render function handles scaling internally based on pixels-per-inch `scale`
        drawRow(ctx, rowData, placements, groups, scale, hoveredGroupId);

        ctx.restore();
    };

    // Click detection state
    const [lastMouseDownTime, setLastMouseDownTime] = useState(0);
    const [lastMouseDownPos, setLastMouseDownPos] = useState({ x: 0, y: 0 });

    // Pan Handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        setDragStart({ x: mouseX - offset.x, y: mouseY - offset.y });
        setLastMouseDownPos({ x: mouseX, y: mouseY });
        setLastMouseDownTime(Date.now());
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
            return;
        }

        // Hit testing for hover
        const mouseX = e.nativeEvent.offsetX - offset.x;
        const mouseY = e.nativeEvent.offsetY - offset.y;

        let hitGroupId = null;
        let hitBounds = null;

        for (const [groupId, bounds] of Object.entries(groupBounds)) {
            if (mouseX >= bounds.minX && mouseX <= bounds.maxX &&
                mouseY >= bounds.minY && mouseY <= bounds.maxY) {
                hitGroupId = groupId;
                hitBounds = bounds;
                break;
            }
        }

        if (hitGroupId !== hoveredGroupId) {
            setHoveredGroupId(hitGroupId);
            if (hitGroupId && hitBounds && onHoverItem) {
                const { groupData } = hitBounds;
                const fullSku = groupData.sku;
                const skuInfo = skuMap ? skuMap[fullSku] : null;
                const typeLabel = groupData.type === 'tower' ? 'Stable Tower' : 'Picking Line';

                let extraInfo = `Type: ${typeLabel}\nQTY: ${groupData.qty} Units`;
                if (skuInfo) {
                    extraInfo += `\nDimensions: ${skuInfo.L}" L x ${skuInfo.W}" W x ${skuInfo.H}" H`;
                    if (skuInfo.note) {
                        extraInfo += `\n\nNote: ${skuInfo.note}`;
                    }
                }

                onHoverItem(e, hitGroupId, `SKU: ${fullSku}`, `Details: ${typeLabel} • ${groupData.qty} Units`, extraInfo);
            } else if (!hitGroupId && onLeaveItem) {
                onLeaveItem();
            }
        }
    };

    const handleMouseUp = (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const dist = Math.sqrt((mouseX - lastMouseDownPos.x) ** 2 + (mouseY - lastMouseDownPos.y) ** 2);
        const timeElapsed = Date.now() - lastMouseDownTime;

        if (dist < 10 && timeElapsed < 400) {
            // It was a click (mouse didn't move much and was fast enough)
            // Hit testing for click
            const rect = canvasRef.current.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) - offset.x;
            const clickY = (e.clientY - rect.top) - offset.y;

            let hitGroupId = null;
            for (const [groupId, bounds] of Object.entries(groupBounds)) {
                if (clickX >= bounds.minX && clickX <= bounds.maxX &&
                    clickY >= bounds.minY && clickY <= bounds.maxY) {
                    hitGroupId = groupId;
                    break;
                }
            }

            if (hitGroupId && onClickItem) {
                const groupData = groups[hitGroupId];
                onClickItem(groupData);
            }
        }
        setIsDragging(false);
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-[#050507] rounded-xl border border-white/10"
        >
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button onClick={() => setScale(s => Math.min(10, s * 1.2))} className="w-8 h-8 flex justify-center items-center bg-white/10 hover:bg-white/20 rounded-md text-white font-mono">+</button>
                <button onClick={() => setScale(s => Math.max(0.5, s / 1.2))} className="w-8 h-8 flex justify-center items-center bg-white/10 hover:bg-white/20 rounded-md text-white font-mono">-</button>
                <button onClick={() => { setScale(baseScale); setOffset({ x: 50, y: 50 }) }} className="px-3 h-8 flex justify-center items-center bg-white/10 hover:bg-white/20 rounded-md text-white text-[10px] font-black uppercase tracking-wider">Reset</button>
            </div>

            <div className="absolute bottom-4 left-4 z-10 text-[9px] font-mono text-gray-500 uppercase">
                Scale: {scale.toFixed(1)} Px/In
            </div>

            <canvas
                ref={canvasRef}
                className={`cursor-${isDragging ? 'grabbing' : 'grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={(e) => {
                    setIsDragging(false); // Fix: don't call handleMouseUp which might trigger click
                    if (onLeaveItem) onLeaveItem();
                    setHoveredGroupId(null);
                }}
            />
        </div>
    );
}
