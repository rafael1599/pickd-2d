import { getSkuColor, getSkuBorderColor } from './colorPalette';
import { INCHES_PER_FOOT } from '../engine/dimensions';

/**
 * Main rendering orchestrator for a single warehouse Row.
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} rowData { id, length, widthFt }
 * @param {Array} placements Output from solveAutoLayout
 * @param {number} scale Pixels per inch
 */
export function drawRow(ctx, rowData, placements, groups, scale, hoveredGroupId) {
    // 1. Calculate physical dimensions in pixels
    // SWAPPED: Engine Length (Depth) becomes Canvas Width (Horizontal rendering)
    // Engine Width becomes Canvas Height
    const renderWidthPx = (rowData.length * INCHES_PER_FOOT + (rowData.lengthIn || 0)) * scale;
    const renderHeightPx = (rowData.widthFt * INCHES_PER_FOOT + (rowData.widthIn || 0)) * scale;

    // 2. Draw Row Background (Floor)
    ctx.fillStyle = '#0a0a0c'; // Extremely dark grey
    ctx.fillRect(0, 0, renderWidthPx, renderHeightPx);
    
    // Draw boundary border
    ctx.strokeStyle = '#3f3f46'; // Zinc 700
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, renderWidthPx, renderHeightPx);

    // 3. Draw Grid Lines (1 foot squares)
    drawGrid(ctx, renderWidthPx, renderHeightPx, scale);

    // 4. Draw Boxes (Placements)
    // Sort by Z index (floor) so taller floors render on top
    const sortedPlacements = [...placements].sort((a, b) => a.z - b.z);

    sortedPlacements.forEach(p => {
        drawBox(ctx, p, scale);
    });

    // 5. Draw Halo on Top (Separate pass so it's never covered)
    if (hoveredGroupId) {
        sortedPlacements.forEach(p => {
            if (p.groupId === hoveredGroupId) {
                drawHalo(ctx, p, scale);
            }
        });
    }

    // 6. Draw Labels
    if (groups && scale >= 1.5) {
        drawLabels(ctx, placements, groups, scale);
    }
}

/**
 * Draws a 1-foot reference grid
 */
function drawGrid(ctx, widthPx, heightPx, scale) {
    const footPx = INCHES_PER_FOOT * scale;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    
    // Vertical lines
    for (let x = 0; x <= widthPx; x += footPx) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, heightPx);
    }
    
    // Horizontal lines
    for (let y = 0; y <= heightPx; y += footPx) {
        ctx.moveTo(0, y);
        ctx.lineTo(widthPx, y);
    }
    
    ctx.stroke();
}

/**
 * Draws a single box placement.
 */
function drawBox(ctx, placement, scale) {
    const { sku, x, y, w, l, floor, rotation } = placement;
    
    // Convert inch coordinates to pixels
    // SWAPPED for horizontal rendering
    const pxX = y * scale; // Engine Y (Depth) -> Canvas X
    const pxY = x * scale; // Engine X (Width) -> Canvas Y
    const pxW = l * scale; // Engine L (Depth size) -> Canvas W
    const pxH = w * scale; // Engine W (Width size) -> Canvas H
    
    // Colors based on floor to give depth perception
    // Higher floors are brighter/more opaque
    const opacity = 0.6 + (floor * 0.08); 
    const bgColor = getSkuColor(sku, opacity);
    const borderColor = getSkuBorderColor(sku, 1);
    
    // Draw Box Fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(pxX, pxY, pxW, pxH);
    
    // Draw Box Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(1, 1 * scale); // Scale the border slightly
    ctx.strokeRect(pxX, pxY, pxW, pxH);
}

/**
 * Draws a soft glowing halo behind a hovered box.
 */
function drawHalo(ctx, placement, scale) {
    const { x, y, w, l } = placement;
    const pxX = y * scale;
    const pxY = x * scale;
    const pxW = l * scale;
    const pxH = w * scale;

    ctx.save();
    
    // Halo settings: vibrant orange glow
    ctx.shadowColor = 'rgba(249, 115, 22, 0.8)'; // Orange-500
    ctx.shadowBlur = 15 * scale;
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 4 * scale;
    
    // Draw an expanded rectangle for the halo
    const padding = 2 * scale;
    ctx.strokeRect(pxX - padding, pxY - padding, pxW + (padding * 2), pxH + (padding * 2));
    
    ctx.restore();
}

/**
 * Draws text labels aggressively grouped by tower/line.
 */
function drawLabels(ctx, placements, groups, scale) {
    if (!groups) return;

    // Calculate bounds for each group
    const groupBounds = {};
    
    placements.forEach(p => {
        if (!p.groupId) return;
        
        // SWAPPED for horizontal rendering
        const pxX = p.y * scale;
        const pxY = p.x * scale;
        const pxW = p.l * scale;
        const pxH = p.w * scale;
        
        if (!groupBounds[p.groupId]) {
            groupBounds[p.groupId] = {
                minX: pxX,
                minY: pxY,
                maxX: pxX + pxW,
                maxY: pxY + pxH,
                topFloor: p.floor
            };
        } else {
            const b = groupBounds[p.groupId];
            b.minX = Math.min(b.minX, pxX);
            b.minY = Math.min(b.minY, pxY);
            b.maxX = Math.max(b.maxX, pxX + pxW);
            b.maxY = Math.max(b.maxY, pxY + pxH);
            b.topFloor = Math.max(b.topFloor, p.floor);
        }
    });

    // Draw labels for each group
    Object.entries(groups).forEach(([groupId, groupData]) => {
        const bounds = groupBounds[groupId];
        if (!bounds) return;

        const centerX = bounds.minX + ((bounds.maxX - bounds.minX) / 2);
        const centerY = bounds.minY + ((bounds.maxY - bounds.minY) / 2);

        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Always draw text orthogonally to the viewer (no rotation for groups to keep them highly readable)
        
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (groupData.type === 'tower') {
            // Big SKU Text + Total Qty
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = `900 ${6 * scale}px sans-serif`;
            const displaySku = groupData.sku.includes('-') ? groupData.sku.split('-')[1] : groupData.sku;
            ctx.fillText(displaySku, 0, -3 * scale);
            
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = `bold ${4 * scale}px monospace`;
            ctx.fillText(`QTY: ${groupData.qty}`, 0, 4 * scale);
            
            // Draw floor indicator in top-right of the bounds
            ctx.fillStyle = 'rgba(255,215,0,0.8)'; // Gold for max floor
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            const wHalf = (bounds.maxX - bounds.minX) / 2;
            const hHalf = (bounds.maxY - bounds.minY) / 2;
            ctx.fillText(`F${bounds.topFloor}`, wHalf - (2*scale), -hHalf + (2*scale));
            
        } else if (groupData.type === 'line') {
            const letter = groupId.charAt(0);
            const number = groupId.slice(1);

            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = `900 ${3.5 * scale}px sans-serif`;
            
            // Draw 'L' on top and the number underneath
            ctx.fillText(letter, 0, -2 * scale);
            ctx.fillText(number, 0, 2 * scale);
        }
        
        ctx.restore();
    });
}
