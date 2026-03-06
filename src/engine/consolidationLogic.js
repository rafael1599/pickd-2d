import { solveAutoLayout } from './stackingEngine.js';
import { WAREHOUSE_STRUCTURE, WAREHOUSE_ROWS } from '../InventoryData.js';

/**
 * Generates a plan to consolidate Bay 3 into Bay 1 and 2.
 * 
 * @param {Object} inventory Current inventory grouped by Row ID { rowId: [{sku, qty}] }
 * @param {Object} skuMap SKU metadata { sku: { L, W, H } }
 * @returns {Object} { plan: [], stats: { totalMoved, spaceRemaining } }
 */
export function generateConsolidationPlan(inventory, skuMap) {
    const bay1Rows = WAREHOUSE_STRUCTURE.bays.find(b => b.id === 'bay-1')?.rows || [];
    const bay2Rows = WAREHOUSE_STRUCTURE.bays.find(b => b.id === 'bay-2')?.rows || [];
    const bay3Rows = WAREHOUSE_STRUCTURE.bays.find(b => b.id === 'bay-3')?.rows || [];

    const targetRowIds = [...bay1Rows, ...bay2Rows];
    const sourceRowIds = [...bay3Rows];

    // 1. Calculate current state of target rows
    const targets = targetRowIds.map(id => {
        const rowData = WAREHOUSE_ROWS.find(r => r.row === id);
        if (!rowData) return null;
        const inv = inventory[id] || [];
        const plan = solveAutoLayout(rowData, skuMap, inv);
        return {
            id,
            data: rowData,
            currentUsedFt: plan.usedLengthFt,
            availableFt: rowData.length - plan.usedLengthFt,
            currentInv: [...inv]
        };
    }).filter(Boolean);

    // 2. Identify all items to move from Bay 3
    const sourceItems = [];
    sourceRowIds.forEach(id => {
        const inv = inventory[id] || [];
        inv.forEach(item => {
            if (item.qty > 0) {
                sourceItems.push({
                    originalRow: id,
                    sku: item.sku,
                    qty: item.qty
                });
            }
        });
    });

    // 3. Greedy algorithm to place source items into targets
    const movementPlan = [];
    
    sourceItems.forEach(item => {
        let remainingToMove = item.qty;
        
        for (const target of targets) {
            if (remainingToMove <= 0) break;
            if (target.availableFt <= 1) continue; 

            let testQty = 1;
            let lastSuccessfulQty = 0;

            while (testQty <= remainingToMove) {
                const testInv = [...target.currentInv, { sku: item.sku, qty: testQty }];
                const result = solveAutoLayout(target.data, skuMap, testInv);
                if (result.usedLengthFt <= target.data.length) {
                    lastSuccessfulQty = testQty;
                    // Exponential increment for speed
                    if (testQty < 10) testQty++;
                    else if (testQty < 50) testQty += 5;
                    else testQty += 10;
                } else {
                    break;
                }
            }
            
            // If binary search/increment found space
            if (lastSuccessfulQty > 0) {
                movementPlan.push({
                    sku: item.sku,
                    from: item.originalRow,
                    to: target.id,
                    qty: lastSuccessfulQty
                });
                
                // Update target state for next item
                target.currentInv.push({ sku: item.sku, qty: lastSuccessfulQty });
                const finalPlan = solveAutoLayout(target.data, skuMap, target.currentInv);
                target.currentUsedFt = finalPlan.usedLengthFt;
                target.availableFt = target.data.length - target.currentUsedFt;
                
                remainingToMove -= lastSuccessfulQty;
            }
        }
    });

    return {
        plan: movementPlan,
        stats: {
            totalItemsProposed: sourceItems.reduce((s, i) => s + i.qty, 0),
            totalItemsMoved: movementPlan.reduce((s, i) => s + i.qty, 0),
            unplacedItems: sourceItems.reduce((s, i) => s + i.qty, 0) - movementPlan.reduce((s, i) => s + i.qty, 0)
        }
    };
}
