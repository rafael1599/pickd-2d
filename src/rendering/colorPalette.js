/**
 * Deterministic color generation based on SKU string.
 * Ensures consistent colors across renders and sessions.
 */
export function getSkuColor(sku, opacity = 1) {
    if (!sku) return `rgba(100, 100, 100, ${opacity})`;
    
    // Simple fast string hash
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
        hash = sku.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL: 
    // Hue from 0-360
    // Saturation high for vibrancy (70-90%)
    // Lightness medium for readability with white text (45-60%)
    const h = Math.abs(hash % 360);
    const s = 70 + Math.abs((hash >> 8) % 20); 
    const l = 45 + Math.abs((hash >> 16) % 15);
    
    // Convert to hex or rgba
    return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
}

/**
 * Gets a darker border color for a given SKU base color.
 */
export function getSkuBorderColor(sku, opacity = 1) {
    if (!sku) return `rgba(50, 50, 50, ${opacity})`;
    
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
        hash = sku.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = Math.abs(hash % 360);
    const s = 70 + Math.abs((hash >> 8) % 20); 
    const l = 25 + Math.abs((hash >> 16) % 15); // Darker lightness
    
    return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
}
