import { proxy, subscribe } from 'valtio'

/**
 * Valtio store for high-performance 3D updates.
 * Proxies allow direct mutation without React re-render overhead.
 */
export const warehouseStore = proxy({
  locations: [],
  inventory: [],
  skuMetadata: {},
  selectedId: null,
  hoveredId: null,

  // Operational location data keyed by rowId
  // Shape: { [rowId]: { zone, maxCapacity, pickingOrder, isActive, notes } }
  locationMeta: {},

  // High-frequency matrices are updated here directly
  instanceData: {
    // locationId -> { skuId -> Array of matrices }
  }
})

// Persistence or debugging
subscribe(warehouseStore, () => {
  // console.log('Store updated')
})
