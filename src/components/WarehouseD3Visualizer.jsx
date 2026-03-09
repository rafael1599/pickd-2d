import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { getSkuColor, getSkuBorderColor } from "../rendering/colorPalette";
import { collapseFor2D } from "../engine/placementOptimizer";
import "../styles/warehouse.css";

export default function WarehouseD3Visualizer({
    placements,
    groups,
    rowData,
    skuMap,
    onHoverItem,
    onLeaveItem,
    onClickItem,
}) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    const SCALE = 4; // 4px per inch — good balance of detail and fit
    const PADDING = 20; // px padding around the drawing

    const rowLengthIn = (rowData.length || 0) * 12 + (rowData.lengthIn || 0);
    const rowWidthIn = (rowData.widthFt || 8) * 12 + (rowData.widthIn || 0);

    // SVG canvas dimensions (engine Y → screen X, engine X → screen Y)
    const canvasW = rowLengthIn * SCALE + PADDING * 2;
    const canvasH = rowWidthIn * SCALE + PADDING * 2;

    const showLocalTooltip = useCallback((evt, p) => {
        const tip = tooltipRef.current;
        if (!tip) return;
        const dims = skuMap?.[p.sku];
        const dimsStr = dims ? `${dims.L}"L × ${dims.W}"W × ${dims.H}"H` : "";
        tip.querySelector(".tooltip-sku").textContent = p.sku;
        tip.querySelector(".tooltip-detail").innerHTML =
            `Floor ${p.floor} · ${p.pattern === "tower" ? "Tower" : "Line"}<br/>` +
            (dimsStr ? `${dimsStr}<br/>` : "") +
            `Group: ${p.groupId}`;
        tip.style.left = `${evt.clientX}px`;
        tip.style.top = `${evt.clientY}px`;
        tip.classList.add("visible");
    }, [skuMap]);

    const hideLocalTooltip = useCallback(() => {
        const tip = tooltipRef.current;
        if (tip) tip.classList.remove("visible");
    }, []);

    useEffect(() => {
        if (!placements || !svgRef.current) return;

        // Collapse to top-floor-only — lower floors are fully occluded in 2D
        const visiblePlacements = collapseFor2D(placements);

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // --- Background grid ---
        const defs = svg.append("defs");
        const gridSize = 12 * SCALE; // 1-foot grid
        defs.append("pattern")
            .attr("id", "grid-pattern")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .attr("patternUnits", "userSpaceOnUse")
            .append("rect")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .attr("fill", "none")
            .attr("stroke", "rgba(255,255,255,0.03)")
            .attr("stroke-width", 0.5);

        // Background fill
        svg.append("rect")
            .attr("width", canvasW)
            .attr("height", canvasH)
            .attr("fill", "#0a0a0c");

        // Grid overlay
        svg.append("rect")
            .attr("width", canvasW)
            .attr("height", canvasH)
            .attr("fill", "url(#grid-pattern)");

        // Row boundary outline
        svg.append("rect")
            .attr("x", PADDING)
            .attr("y", PADDING)
            .attr("width", rowLengthIn * SCALE)
            .attr("height", rowWidthIn * SCALE)
            .attr("fill", "none")
            .attr("stroke", "rgba(249, 115, 22, 0.15)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 4");

        // --- visiblePlacements already contains only top-floor boxes ---
        // No need to sort by floor or compute topFloors — all are top-level
        const sorted = visiblePlacements;

        // --- Draw boxes ---
        sorted.forEach((p) => {
            const isTopLevel = true;

            // Engine coordinate mapping:
            // engine Y (depth along aisle) → screen X
            // engine X (width across aisle) → screen Y
            const x = PADDING + p.y * SCALE;
            const y = PADDING + p.x * SCALE;
            const w = p.l * SCALE; // engine l → screen width
            const h = p.w * SCALE; // engine w → screen height

            const floorOpacity = 0.5 + (p.floor / 5) * 0.5; // Higher floors more opaque

            const g = svg.append("g")
                .attr("class", `placement-group`)
                .attr("data-group", p.groupId)
                .attr("data-sku", p.sku)
                .style("cursor", isTopLevel ? "pointer" : "default")
                .style("pointer-events", isTopLevel ? "all" : "none");

            // Box shadow (subtle depth effect)
            if (p.floor > 1) {
                g.append("rect")
                    .attr("x", x + 2)
                    .attr("y", y + 2)
                    .attr("width", w)
                    .attr("height", h)
                    .attr("rx", 1)
                    .attr("fill", "rgba(0,0,0,0.3)");
            }

            // Main box rectangle
            g.append("rect")
                .attr("class", "box-rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", w)
                .attr("height", h)
                .attr("rx", 1)
                .attr("fill", getSkuColor(p.sku, floorOpacity))
                .attr("stroke", getSkuBorderColor(p.sku, 1))
                .attr("stroke-width", 1);

            // Floor number label (only if box is big enough)
            if (w > 20 && h > 14) {
                g.append("text")
                    .attr("x", x + w / 2)
                    .attr("y", y + h / 2)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .attr("fill", "rgba(255,255,255,0.6)")
                    .attr("font-family", "'JetBrains Mono', monospace")
                    .attr("font-weight", 700)
                    .attr("font-size", `${Math.min(10, Math.max(7, h * 0.4))}px`)
                    .attr("pointer-events", "none")
                    .text(`F${p.floor}`);
            }

            // Interaction events
            g.on("mouseover", (evt) => {
                showLocalTooltip(evt, p);
                if (onHoverItem) {
                    onHoverItem(evt, p.sku, `Floor ${p.floor}`, p.groupId);
                }
            })
                .on("mousemove", (evt) => {
                    const tip = tooltipRef.current;
                    if (tip) {
                        tip.style.left = `${evt.clientX}px`;
                        tip.style.top = `${evt.clientY}px`;
                    }
                })
                .on("mouseout", () => {
                    hideLocalTooltip();
                    if (onLeaveItem) onLeaveItem();
                })
                .on("click", () => {
                    const groupData = groups[p.groupId];
                    if (onClickItem && groupData) {
                        onClickItem({ ...groupData, groupId: p.groupId });
                    }
                });
        });

        // --- Group labels ---
        if (groups) {
            Object.entries(groups).forEach(([id, gData]) => {
                const groupPlacements = sorted.filter((p) => p.groupId === id);
                if (!groupPlacements.length) return;

                // Calculate bounding box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                groupPlacements.forEach((p) => {
                    const px = PADDING + p.y * SCALE;
                    const py = PADDING + p.x * SCALE;
                    const pw = p.l * SCALE;
                    const ph = p.w * SCALE;
                    minX = Math.min(minX, px);
                    minY = Math.min(minY, py);
                    maxX = Math.max(maxX, px + pw);
                    maxY = Math.max(maxY, py + ph);
                });

                const cx = (minX + maxX) / 2;
                const topY = minY - 8;
                const labelWidth = maxX - minX;

                // Group outline (subtle)
                svg.append("rect")
                    .attr("x", minX - 2)
                    .attr("y", minY - 2)
                    .attr("width", maxX - minX + 4)
                    .attr("height", maxY - minY + 4)
                    .attr("rx", 3)
                    .attr("fill", "none")
                    .attr("stroke", gData.type === "tower" ? "rgba(249,115,22,0.2)" : "rgba(59,130,246,0.2)")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "3 3");

                // Label background
                const labelText = gData.type === "tower"
                    ? `${id} · ${gData.sku} (${gData.qty})`
                    : `${id} · ${gData.sku} (${gData.qty})`;

                const fontSize = Math.min(11, Math.max(8, labelWidth * 0.08));

                // Label text
                svg.append("text")
                    .attr("class", "group-label")
                    .attr("x", cx)
                    .attr("y", topY)
                    .attr("text-anchor", "middle")
                    .attr("fill", gData.type === "tower" ? "#f97316" : "#3b82f6")
                    .attr("font-family", "'Inter', sans-serif")
                    .attr("font-weight", 900)
                    .attr("font-size", `${fontSize}px`)
                    .attr("letter-spacing", "0.05em")
                    .text(labelText);
            });
        }

        // --- Ruler markings ---
        // Horizontal ruler (depth)
        for (let ft = 0; ft <= Math.ceil(rowLengthIn / 12); ft++) {
            const x = PADDING + ft * 12 * SCALE;
            if (ft % 5 === 0) {
                svg.append("text")
                    .attr("x", x)
                    .attr("y", canvasH - 4)
                    .attr("text-anchor", "middle")
                    .attr("fill", "rgba(255,255,255,0.15)")
                    .attr("font-family", "'JetBrains Mono', monospace")
                    .attr("font-size", "8px")
                    .text(`${ft}'`);
            }
        }

    }, [placements, groups, rowData, skuMap, SCALE, showLocalTooltip, hideLocalTooltip, onHoverItem, onLeaveItem, onClickItem]);

    return (
        <div className="warehouse-d3-container" ref={containerRef}>
            <svg
                ref={svgRef}
                width={canvasW}
                height={canvasH}
                style={{ minWidth: canvasW, minHeight: canvasH }}
            />
            {/* Custom tooltip element */}
            <div className="d3-tooltip" ref={tooltipRef}>
                <div className="tooltip-sku"></div>
                <div className="tooltip-detail"></div>
            </div>
        </div>
    );
}
