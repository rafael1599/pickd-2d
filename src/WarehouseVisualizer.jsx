import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { WAREHOUSE_STRUCTURE, WAREHOUSE_ROWS, INITIAL_INVENTORY } from './InventoryData'
import { solveAutoLayout } from './engine/stackingEngine'
import { DEFAULT_BOX } from './engine/dimensions'
import { getSkuColor } from './rendering/colorPalette'
import { supabase } from './supabaseClient'
import { warehouseStore } from './store/state'
import { generateConsolidationPlan } from './engine/consolidationLogic'
import { generatePDFReport } from './engine/consolidationReport'

// New Sub-components
import { Tooltip } from './components/Common'
import { WarehouseFloorPlan } from './components/WarehouseFloorPlan'
import { BayDetailView } from './components/BayDetailView'
import { RowDetailView } from './components/RowDetailView'
import { ConsolidationModal } from './components/ConsolidationModal'
import { Warehouse3DVisualizer } from './components/Warehouse3DVisualizer'

export function WarehouseVisualizer() {
    const [view, setView] = useState('global')
    const [selectedBay, setSelectedBay] = useState(null)
    const [selectedRow, setSelectedRow] = useState(null)
    const [inventory, setInventory] = useState(INITIAL_INVENTORY)
    const [scale, setScale] = useState(8)
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', desc: '', extra: '' })

    const [locationsMap, setLocationsMap] = useState({})

    const [skuMap, setSkuMap] = useState({})
    const [rowActivityMap, setRowActivityMap] = useState({})
    const [isUpdating, setIsUpdating] = useState(false)
    const [consolidationResult, setConsolidationResult] = useState(null)
    const [isConsolidating, setIsConsolidating] = useState(false)
    const [isSimulatedView, setIsSimulatedView] = useState(false)

    const fetchData = useCallback(async () => {
        // Fetch Inventory — only active rows with stock
        const { data: invData, error: invError } = await supabase
            .from('inventory')
            .select('sku, location, quantity, is_active, updated_at, item_name, warehouse')
            .eq('warehouse', 'LUDLOW')
            .eq('is_active', true)
            .gt('quantity', 0);
        if (invError) console.error("Error fetching inventory:", invError);

        // Fetch SKU Metadata
        const { data: metaData, error: metaError } = await supabase.from('sku_metadata').select('sku, length_in, width_in, height_in, sku_note');
        if (metaError) console.error("Error fetching metadata:", metaError);

        // Fetch Locations (Dimensions + operational fields)
        const { data: locData, error: locError } = await supabase
            .from('locations')
            .select('location, length_ft, length_in, width_ft, width_in, zone, max_capacity, picking_order, is_active, notes')
            .eq('warehouse', 'LUDLOW');
        if (locError) console.error("Error fetching locations:", locError);

        if (locData) {
            const map = {};
            locData.forEach(l => {
                let id = l.location.toUpperCase().startsWith("ROW ") ? l.location.substring(4).trim() : l.location;
                if (!isNaN(id)) id = parseInt(id, 10);
                map[id] = {
                    length: l.length_ft || 0,
                    lengthIn: l.length_in || 0,
                    widthFt: l.width_ft || 0,
                    widthIn: l.width_in || 0,
                    zone: l.zone || 'UNASSIGNED',
                    maxCapacity: l.max_capacity || 550,
                    pickingOrder: l.picking_order ?? null,
                    isActive: l.is_active ?? true,
                    notes: l.notes || null,
                };
            });
            setLocationsMap(map);
        }

        if (metaData) {
            const map = {};
            metaData.forEach(m => {
                const skuKey = (m.sku || "").trim();
                map[skuKey] = { L: m.length_in, W: m.width_in, H: m.height_in, note: m.sku_note };
            });
            setSkuMap(map);
        }

        if (invData) {
            const grouped = {};
            invData.forEach(item => {
                let rawLocation = item.location || "";
                let rowId = rawLocation.trim();

                // Normalize "ROW 10" -> 10 or "ROW 19B" -> "19B"
                if (rowId.toUpperCase().startsWith("ROW ")) {
                    rowId = rowId.substring(4).trim();
                }

                // If it's a numeric string, convert to number for matches
                if (rowId !== "" && !isNaN(rowId)) {
                    rowId = parseInt(rowId, 10);
                }

                if (!grouped[rowId]) grouped[rowId] = [];
                grouped[rowId].push({
                    sku: item.sku,
                    qty: item.quantity,
                    rawLocation: rawLocation, // Store original for DB updates
                    warehouse: item.warehouse,
                    updatedAt: item.updated_at,
                    itemName: item.item_name || null,
                });
            });
            setInventory(grouped);
        } else {
            setInventory({});
        }

        // Fetch location activity metrics from inventory_logs via SECURITY DEFINER RPC
        // (direct table query blocked by RLS for anon key)
        const { data: activityData, error: activityError } = await supabase
            .rpc('get_location_activity', { p_warehouse: 'LUDLOW', p_days_short: 7, p_days_long: 30 });
        if (activityError) {
            console.error("Error fetching location activity:", activityError);
        } else if (activityData) {
            const actMap = {};
            activityData.forEach(row => {
                // Normalize location string to rowId key, same as inventory normalization
                let loc = (row.location || "").trim();
                if (loc.toUpperCase().startsWith("ROW ")) loc = loc.substring(4).trim();
                if (loc !== "" && !isNaN(loc)) loc = parseInt(loc, 10);
                actMap[loc] = {
                    lastTouchedAt: row.last_touched_at,
                    movementCount7d: Number(row.movement_count_short),
                    movementCount30d: Number(row.movement_count_long),
                };
            });
            setRowActivityMap(actMap);
        }
    }, []);

    const simulatedInventory = useMemo(() => {
        if (!consolidationResult || !consolidationResult.plan) return inventory;

        // Deep clone inventory
        const newInv = JSON.parse(JSON.stringify(inventory));

        // Apply movements to simulation
        consolidationResult.plan.forEach(move => {
            // Decrease from source
            if (newInv[move.from]) {
                const sourceItem = newInv[move.from].find(i => i.sku === move.sku);
                if (sourceItem) sourceItem.qty = Math.max(0, sourceItem.qty - move.qty);
            }

            // Increase in target
            if (!newInv[move.to]) newInv[move.to] = [];
            const targetItem = newInv[move.to].find(i => i.sku === move.sku);
            if (targetItem) {
                targetItem.qty += move.qty;
            } else {
                newInv[move.to].push({ sku: move.sku, qty: move.qty, rawLocation: `ROW ${move.to}` });
            }
        });

        return newInv;
    }, [inventory, consolidationResult]);

    const activeInventory = isSimulatedView ? simulatedInventory : inventory;

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Sync operational location metadata into Valtio store for 3D and other consumers
    useEffect(() => {
        const meta = {};
        Object.entries(locationsMap).forEach(([rowId, data]) => {
            meta[rowId] = {
                zone: data.zone,
                maxCapacity: data.maxCapacity,
                pickingOrder: data.pickingOrder,
                isActive: data.isActive,
                notes: data.notes,
            };
        });
        warehouseStore.locationMeta = meta;
    }, [locationsMap]);

    const handleUpdateQuantity = async (sku, rawLocation, newQty) => {
        setIsUpdating(true);
        const { error } = await supabase
            .from('inventory')
            .update({ quantity: newQty })
            .match({ sku, location: rawLocation });

        if (error) {
            console.error("Error updating quantity:", error);
            alert("Failed to update quantity: " + error.message);
        } else {
            await fetchData(); // Refresh data from source of truth
        }
        setIsUpdating(false);
    };

    const handleRunConsolidationPlan = () => {
        setIsConsolidating(true);
        const result = generateConsolidationPlan(inventory, skuMap);
        setConsolidationResult(result);
        setIsConsolidating(false);
    };

    const handleCommitConsolidation = async () => {
        if (!consolidationResult) return;
        setIsUpdating(true);

        // Generate PDF Report before executing moves
        generatePDFReport(consolidationResult);

        const errors = [];
        for (const move of consolidationResult.plan) {
            const fromLocation = `ROW ${move.from}`;
            const toLocation = `ROW ${move.to}`;

            const { error } = await supabase.rpc('move_inventory_stock', {
                p_sku: move.sku,
                p_from_warehouse: 'LUDLOW',
                p_from_location: fromLocation,
                p_to_warehouse: 'LUDLOW',
                p_to_location: toLocation,
                p_qty: move.qty,
                p_performed_by: 'pickd-2d Consolidation',
                p_user_id: null,
            });

            if (error) {
                console.error(`Consolidation move failed (${move.sku} ${fromLocation} → ${toLocation}):`, error);
                errors.push(`${move.sku}: ${error.message}`);
            }
        }

        await fetchData();
        setConsolidationResult(null);
        setIsSimulatedView(false);
        setIsUpdating(false);

        if (errors.length > 0) {
            alert(`Consolidation completed with ${errors.length} error(s):\n${errors.join('\n')}`);
        } else {
            alert("Consolidation complete! Bay 3 elements moved to Bay 1 & 2. PDF Report Generated.");
        }
    };

    const showTooltip = useCallback((e, title, desc, extra = '') => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top,
            title, desc, extra
        });
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(t => ({ ...t, visible: false }));
    }, []);

    const handleUpdateDimensions = async (rowId, field, value) => {
        setIsUpdating(true);
        const rawLocation = isNaN(rowId) ? `ROW ${rowId}` : `ROW ${rowId}`; // Standardize name

        // Map field to DB column name
        const dbFields = {
            length: 'length_ft',
            lengthIn: 'length_in',
            widthFt: 'width_ft',
            widthIn: 'width_in'
        };

        const { error } = await supabase
            .from('locations')
            .update({ [dbFields[field]]: value })
            .ilike('location', rawLocation);

        if (error) {
            console.error("Error updating dimensions:", error);
            alert("Failed to update dimensions: " + error.message);
        } else {
            await fetchData();
        }
        setIsUpdating(false);
    };

    const getRowData = (id) => {
        const hardcoded = WAREHOUSE_ROWS.find(r => r.row === id);
        const dbData = locationsMap[id];
        if (dbData) {
            return {
                ...hardcoded,
                row: id,
                length: dbData.length || hardcoded?.length || 0,
                lengthIn: dbData.lengthIn || 0,
                widthFt: dbData.widthFt || hardcoded?.widthFt || 8,
                widthIn: dbData.widthIn || 0,
                zone: dbData.zone || null,
                maxCapacity: dbData.maxCapacity || null,
            };
        }
        return hardcoded;
    }
    const getRowInventory = (id) => activeInventory[id] || []

    const goToGlobal = () => { setView('global'); setSelectedBay(null); setSelectedRow(null); hideTooltip(); }
    const goToBay = (bay) => { setView('bay'); setSelectedBay(bay); setSelectedRow(null); hideTooltip(); }
    const goToRow = (row) => { setView('row'); setSelectedRow(row); hideTooltip(); }
    const goTo3D = () => { setView('3d'); hideTooltip(); }

    const getRowPlan = useCallback((rowId) => {
        const rowData = getRowData(rowId);
        const inv = getRowInventory(rowId);
        return solveAutoLayout(rowData, skuMap, inv);
    }, [activeInventory, skuMap, locationsMap]);

    const currentRowData = useMemo(() => {
        if (!selectedRow) return null;
        return getRowData(selectedRow.row);
    }, [selectedRow, locationsMap]);

    const rowPlan = useMemo(() => {
        if (!currentRowData) return null;
        return getRowPlan(currentRowData.row);
    }, [currentRowData, getRowPlan]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Navigation for Row View
            if (view === 'row' && selectedRow) {
                const flatRows = WAREHOUSE_STRUCTURE.bays.flatMap(bay =>
                    bay.rows.map(rowId => ({ bay, rowId }))
                );
                const currentIndex = flatRows.findIndex(item => item.rowId === selectedRow.row);
                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
                else if (e.key === 'ArrowDown') nextIndex = Math.min(flatRows.length - 1, currentIndex + 1);

                if (nextIndex !== currentIndex) {
                    const nextItem = flatRows[nextIndex];
                    const nextRowData = getRowData(nextItem.rowId);
                    if (nextRowData) {
                        setSelectedBay(nextItem.bay);
                        setSelectedRow(nextRowData);
                    }
                }
            }

            // Navigation for Bay View
            if (view === 'bay' && selectedBay) {
                const currentIndex = WAREHOUSE_STRUCTURE.bays.findIndex(b => b.id === selectedBay.id);
                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
                else if (e.key === 'ArrowDown') nextIndex = Math.min(WAREHOUSE_STRUCTURE.bays.length - 1, currentIndex + 1);

                if (nextIndex !== currentIndex) {
                    setSelectedBay(WAREHOUSE_STRUCTURE.bays[nextIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, selectedRow, selectedBay, locationsMap]);

    return (
        <div className="w-full h-full bg-[#050507] text-white overflow-hidden">
            <Tooltip tooltip={tooltip} />

            {view === 'global' && (
                <WarehouseFloorPlan
                    onBaySelect={goToBay}
                    onRowSelect={goToRow}
                    getRowInventory={getRowInventory}
                    getRowData={getRowData}
                    skuMap={skuMap}
                    locationsMap={locationsMap}
                    rowActivityMap={rowActivityMap}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    isSimulatedView={isSimulatedView}
                    setIsSimulatedView={setIsSimulatedView}
                    handleRunConsolidationPlan={handleRunConsolidationPlan}
                    consolidationResult={consolidationResult}
                    isConsolidating={isConsolidating}
                    isUpdating={isUpdating}
                    fetchData={fetchData}
                    onGo3D={goTo3D}
                />
            )}

            {view === '3d' && (
                <Warehouse3DVisualizer
                    inventory={activeInventory}
                    locationsMap={locationsMap}
                    skuMap={skuMap}
                    onGoBack={goToGlobal}
                />
            )}

            {view === 'bay' && (
                <BayDetailView
                    selectedBay={selectedBay}
                    onGoBack={goToGlobal}
                    onRowSelect={goToRow}
                    getRowData={getRowData}
                    getRowInventory={getRowInventory}
                    skuMap={skuMap}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    scale={scale}
                />
            )}

            {view === 'row' && (
                <RowDetailView
                    currentRowData={currentRowData}
                    rowPlan={rowPlan}
                    selectedBay={selectedBay}
                    skuMap={skuMap}
                    onGoBackGlobal={goToGlobal}
                    onGoBackBay={() => goToBay(selectedBay)}
                    onUpdateDimensions={handleUpdateDimensions}
                    onUpdateQuantity={handleUpdateQuantity}
                    isUpdating={isUpdating}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    inventory={getRowInventory(currentRowData.row)}
                />
            )}

            <ConsolidationModal
                result={consolidationResult}
                isUpdating={isUpdating}
                onClose={() => setConsolidationResult(null)}
                onCommit={handleCommitConsolidation}
            />
        </div>
    )
}
