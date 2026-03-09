/**
 * Placement optimizer — reduces render load by collapsing stacked boxes.
 *
 * 2D views (top-down): Lower floors are completely occluded, so we only
 * keep the top-floor placement per stack position.
 *
 * 3D view: Lower floors are merged into a single "base" box whose height
 * equals (topFloor − 1) × H.  Individual boxes are kept only for the
 * top floor, so the visual result is nearly identical but with far fewer
 * meshes / draw calls.
 */

/**
 * For 2D renderers — returns only the top-floor placement at each (x, y).
 */
export function collapseFor2D(placements) {
    const topMap = new Map();

    for (let i = 0; i < placements.length; i++) {
        const p = placements[i];
        const key = `${p.x}|${p.y}`;
        const existing = topMap.get(key);
        if (!existing || p.floor > existing.floor) {
            topMap.set(key, p);
        }
    }

    return Array.from(topMap.values());
}

/**
 * For the 3D renderer — returns:
 *  • one "base" box per stack (floors 1…N-1 merged into one tall box)
 *  • all individual boxes that sit on the top floor
 *
 * Each base box is a synthetic placement with:
 *   floor: 1, h: (topFloor - 1) * originalH, _isBase: true
 */
export function collapseFor3D(placements, skuMap) {
    // Group by stack column (same x, y)
    const stacks = new Map();

    for (let i = 0; i < placements.length; i++) {
        const p = placements[i];
        const key = `${p.x}|${p.y}`;
        let stack = stacks.get(key);
        if (!stack) {
            stack = { topFloor: p.floor, items: [p] };
            stacks.set(key, stack);
        } else {
            stack.items.push(p);
            if (p.floor > stack.topFloor) stack.topFloor = p.floor;
        }
    }

    const result = [];

    for (const [, stack] of stacks) {
        const { topFloor, items } = stack;

        if (topFloor <= 1) {
            // Single floor — keep as-is
            result.push(...items);
            continue;
        }

        // Keep only top-floor boxes as individual units
        const topItems = items.filter(p => p.floor === topFloor);
        result.push(...topItems);

        // Create one consolidated base box per stack position
        // Use the first item as a template (same sku, x, y, w, l, etc.)
        const template = items[0];
        const sku = template.sku;
        const dims = skuMap?.[sku];
        const unitH = dims?.H || template.h || 10;

        result.push({
            ...template,
            floor: 1,
            h: unitH * (topFloor - 1),
            _isBase: true,
        });
    }

    return result;
}
