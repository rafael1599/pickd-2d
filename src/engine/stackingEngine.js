import { BOX_MARGIN, MAX_FLOORS, INCHES_PER_FOOT, DEFAULT_BOX } from './dimensions.js';

export function calcEffectiveBoxSize(item) {
    if (!item) return { L: 0, W: 0, H: 0 };
    const marginAddition = BOX_MARGIN * 2;
    return {
        L: (item.L || 0) + marginAddition,
        W: (item.W || 0) + marginAddition,
        H: item.H || 0,
        originalL: item.L || 0,
        originalW: item.W || 0,
        originalH: item.H || 0
    };
}

export function getLineDepthCapacity(rowLengthFt, boxEffL) {
    if (!boxEffL || boxEffL <= 0) return 0;
    return Math.floor((rowLengthFt * INCHES_PER_FOOT) / boxEffL);
}

export function getLineWidthCapacity(rowWidthFt, boxEffW) {
    if (!boxEffW || boxEffW <= 0) return 0;
    return Math.floor((rowWidthFt * INCHES_PER_FOOT) / boxEffW);
}

export function getTowerCapacity() {
    return 6 * MAX_FLOORS;
}

/**
 * solveAutoLayout:
 * Engine X = Row Width (Canvas Vertical)
 * Engine Y = Row Depth (Canvas Horizontal)
 */
export function solveAutoLayout(rowData, skuMap, inventory) {
    const placements = [];
    const warnings = [];
    const groups = {};
    
    let tCount = 1;
    let lCount = 1;
    
    const rowWidthFt = rowData.widthFt || 8;
    const rowWidthIn = rowWidthFt * INCHES_PER_FOOT;
    const getCenterX = (footprintW) => Math.max(0, (rowWidthIn - footprintW) / 2);
    const getSkuDims = (sku) => {
        const raw = skuMap[sku];
        if (!raw) return calcEffectiveBoxSize(DEFAULT_BOX);
        return calcEffectiveBoxSize({
            L: raw.L || DEFAULT_BOX.L,
            W: raw.W || DEFAULT_BOX.W,
            H: raw.H || DEFAULT_BOX.H
        });
    };

    let pending = [...inventory].map(i => ({ ...i })).sort((a, b) => b.qty - a.qty);
    pending = pending.filter(i => i.qty > 0);
    let remainingTotalQty = pending.reduce((sum, item) => sum + item.qty, 0);
    let currentSkuIndex = 0;

    function takeUnits(qtyNeeded) {
        let taken = 0;
        let mainSku = null;
        while (taken < qtyNeeded && currentSkuIndex < pending.length) {
            let p = pending[currentSkuIndex];
            if (p.qty <= 0) { currentSkuIndex++; continue; }
            if (!mainSku) mainSku = p.sku;
            let toTake = Math.min(p.qty, qtyNeeded - taken);
            p.qty -= toTake;
            taken += toTake;
            remainingTotalQty -= toTake;
            if (p.qty <= 0) currentSkuIndex++;
        }
        return { taken, sku: mainSku || 'UNKNOWN' };
    }

    let rowCursorY = 0;
    let isFirstPlacement = true;

    while (remainingTotalQty > 0) {
        let requireTower = (isFirstPlacement || remainingTotalQty >= 6);
        
        if (requireTower) {
            let toTake = Math.min(30, remainingTotalQty);
            if (remainingTotalQty - toTake > 0 && remainingTotalQty - toTake < 6) toTake = remainingTotalQty - 6;
            
            let { taken, sku } = takeUnits(toTake);
            let dims = getSkuDims(sku);
            
            const towerSide = Math.max(dims.L, dims.W * 6);
            const globalPadX = getCenterX(towerSide);
            const slotSize = towerSide / 6;
            const spreadPad = (slotSize - dims.W) / 2;

            let groupId = `T${tCount++}`;
            groups[groupId] = { type: 'tower', sku, qty: taken };
            
            let placedInTower = 0;
            let currentFloor = 0;

            while (placedInTower < taken && currentFloor < MAX_FLOORS) {
                let toPlace = Math.min(6, taken - placedInTower);
                const isVerticalOrientation = (currentFloor % 2 === 0);
                
                if (isVerticalOrientation) {
                    // 6 Boxes arranged side-by-side HORIZONTALLY (Y axis) 
                    // To form a stable 54" wide base for the next level.
                    const offsetX = (towerSide - dims.L) / 2;
                    for (let i = 0; i < toPlace; i++) {
                        placements.push({
                            sku,
                            x: globalPadX + offsetX + BOX_MARGIN,
                            y: rowCursorY + (i * slotSize) + spreadPad + BOX_MARGIN,
                            z: currentFloor * dims.H,
                            w: dims.originalL, // 54" tall (Vertical Screen)
                            l: dims.originalW, // 8" wide (Horizontal Screen)
                            h: dims.originalH,
                            floor: currentFloor + 1, pattern: 'tower', rotation: 90, groupId
                        });
                    }
                } else {
                    // 6 Boxes arranged side-by-side VERTICALLY (X axis)
                    // Each box is 54" long horizontally.
                    const offsetY = (towerSide - dims.L) / 2;
                    for (let i = 0; i < toPlace; i++) {
                        placements.push({
                            sku,
                            x: globalPadX + (i * slotSize) + spreadPad + BOX_MARGIN,
                            y: rowCursorY + offsetY + BOX_MARGIN,
                            z: currentFloor * dims.H,
                            w: dims.originalW, // 8" tall (Vertical Screen)
                            l: dims.originalL, // 54" wide (Horizontal Screen)
                            h: dims.originalH,
                            floor: currentFloor + 1, pattern: 'tower', rotation: 0, groupId
                        });
                    }
                }
                placedInTower += toPlace;
                currentFloor++;
            }
            rowCursorY += towerSide; 
            isFirstPlacement = false;
        } else {
            let toTake = Math.min(5, remainingTotalQty);
            let { taken, sku } = takeUnits(toTake);
            let dims = getSkuDims(sku);
            
            let groupId = `L${lCount++}`;
            groups[groupId] = { type: 'line', sku, qty: taken };
            
            const globalPadX = getCenterX(dims.W); 
            // Picker lines: Vertical bar centered
            for (let f = 0; f < taken && f < MAX_FLOORS; f++) {
                placements.push({
                    sku,
                    x: globalPadX + BOX_MARGIN,
                    y: rowCursorY + BOX_MARGIN,
                    z: f * dims.H,
                    w: dims.originalL, 
                    l: dims.originalW, 
                    h: dims.originalH,
                    floor: f + 1, pattern: 'line', rotation: 90, groupId
                });
            }
            rowCursorY += dims.W; 
            isFirstPlacement = false;
        }
    }

    const usedLengthIn = rowCursorY;
    const rowLengthIn = (rowData.length || 0) * INCHES_PER_FOOT + (rowData.lengthIn || 0);
    return {
        placements, warnings, groups,
        usedLengthFt: Math.ceil(usedLengthIn/12),
        usedLengthIn,
        rowLengthFt: rowData.length || 0,
        rowLengthIn,
        requiredLengthFt: Math.max(Math.ceil(usedLengthIn/12), rowData.length || 0)
    };
}
