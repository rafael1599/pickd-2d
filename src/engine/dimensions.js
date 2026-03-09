/**
 * Data types and default dimension constants for the Warehouse Engine.
 */

// All measurements are in INCHES internally unless specified otherwise.
export const INCHES_PER_FOOT = 12;

// Margin required around every box (in inches) to account for physical reality.
// Note: This margin applies to the 4 horizontal sides (L and W), NOT vertically.
export const BOX_MARGIN = 0.5;

// Maximum number of boxes that can be stacked vertically
export const MAX_FLOORS = 999;

// Default dimensions matching Row 1 realistic averages
export const DEFAULT_BOX = {
    // Length (depth relative to the row)
    L: 54,
    // Width (across the row)
    W: 8,
    // Height
    H: 30
};

// If a row is exactly the width of a single SKU (length-wise), then 
// its width is 60 inches (5 feet).
export const DEFAULT_ROW_WIDTH_FT = 5;
