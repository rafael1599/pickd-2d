import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Instances, Instance } from '@react-three/drei'
import { useSnapshot } from 'valtio'
import { warehouseStore } from '../../store/state'
import { getSkuColor } from '../../rendering/colorPalette'
import { collapseFor3D } from '../../engine/placementOptimizer'

const tempMatrix = new THREE.Matrix4()
const tempPos = new THREE.Vector3()
const tempRot = new THREE.Quaternion()
const tempScale = new THREE.Vector3()

/**
 * High-performance SKU rendering using InstancedMesh.
 * All boxes share the same geometry but have different transforms.
 */
export function SKUInstances({ items, skuMap, locationPosition }) {
    // Collapse stacked boxes: base block + top-floor individuals only
    const optimizedItems = useMemo(() => collapseFor3D(items, skuMap), [items, skuMap]);

    // 1. Calculate top level per stack for interaction optimization
    const topLevels = useMemo(() => {
        const map = new Map();
        optimizedItems.forEach(item => {
            const key = `${item.x}-${item.y}`;
            const currentMax = map.get(key) || 0;
            if (item.floor > currentMax) map.set(key, item.floor);
        });
        return map;
    }, [optimizedItems]);

    // We use the unit box for all instances
    return (
        <Instances range={optimizedItems.length}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial />

            {optimizedItems.map((item, idx) => (
                <SingleSKU
                    key={`${item.sku}-${idx}`}
                    item={item}
                    skuMeta={skuMap[item.sku]}
                    locationPosition={locationPosition}
                    isTopLevel={item.floor === topLevels.get(`${item.x}-${item.y}`)}
                />
            ))}
        </Instances>
    )
}

function SingleSKU({ item, skuMeta, locationPosition, isTopLevel }) {
    const matrix = useMemo(() => {
        if (!skuMeta) return new THREE.Matrix4()

        const unitH = skuMeta.H || 10;
        // _isBase: consolidated block for all floors below the top
        const renderH = item._isBase ? item.h : unitH;

        // 1. Calculate relative position from distribution JSONB
        const xRel = (item.x || 0) / 12
        const yRel = (item.floor || 1) * unitH / 12 // simplified Z
        const zRel = (item.y || 0) / 12

        // 2. Compose Matrix: Position (World) + Rotation + Scale (Inches to Feet)
        tempPos.set(xRel, yRel, zRel)
        tempRot.set(0, 0, 0, 1) // No rotation for now
        tempScale.set(skuMeta.L / 12, renderH / 12, skuMeta.W / 12)

        return tempMatrix.compose(tempPos, tempRot, tempScale).clone()
    }, [item, skuMeta])

    const color = getSkuColor(item.sku)

    return (
        <Instance
            matrix={matrix}
            color={color}
            // Only capture events for the top-most unit to boost performance
            onPointerDown={(e) => {
                if (!isTopLevel) return
                e.stopPropagation()
                warehouseStore.selectedId = item.sku
                console.log(`Selected SKU: ${item.sku}`)
            }}
            onPointerOver={(e) => {
                if (!isTopLevel) return
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
                if (!isTopLevel) return
                document.body.style.cursor = 'default'
            }}
        />
    )
}
