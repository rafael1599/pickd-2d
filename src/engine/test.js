import { solveAutoLayout, INCHES_PER_FOOT } from './stackingEngine.js';

const mockSkuMap = {
    "A-001": { L: 24, W: 16, H: 12 }, // Effective: 25 x 17
    "B-002": { L: 30, W: 20, H: 15 }  // Effective: 31 x 21
};

const mockInventory = [
    { sku: "A-001", qty: 35 },
    { sku: "B-002", qty: 2 }
];

const mockRow = {
    id: 1,
    length: 5, // 5 x 12 = 60 inches depth
    widthFt: 4 // 4 x 12 = 48 inches wide
};

const result = solveAutoLayout(mockRow, mockSkuMap, mockInventory);

console.log("---- WAREHOUSE ENGINE TEST ----");
console.log(`Row: ${mockRow.widthFt * INCHES_PER_FOOT}" Wide x ${mockRow.length * INCHES_PER_FOOT}" Deep`);
console.log("-------------------------------");
console.log(`Placed ${result.placements.length} units.`);
console.dir(result.placements, { depth: null });

if (result.warnings.length > 0) {
    console.log("\nWARNINGS:");
    result.warnings.forEach(w => console.log(`- ${w}`));
}
