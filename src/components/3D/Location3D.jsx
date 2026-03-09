import React, { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Renders a procedural rack wireframe.
 * Width is calculated based on the widest SKU in this location.
 * Length comes from the database length_ft.
 */
export function Location3D({ location, itemsAtLocation, skuMap }) {
    const rackDimensions = useMemo(() => {
        const lengths = itemsAtLocation.map(item => skuMap[item.sku]?.L || 0)
        const maxWidth = lengths.length > 0 ? Math.max(...lengths) : 12 // Default 12" if empty
        const lengthIn = (location.length_ft || 0) * 12 + (location.length_in || 0)

        return {
            w: maxWidth / 12, // convert to feet for world scale
            l: lengthIn / 12,
            h: 8 // default height 8ft
        }
    }, [location, itemsAtLocation, skuMap])

    return (
        <group position={[0, 0, 0]}>
            {/* Rack Base / Floor slice */}
            <mesh position={[0, -0.05, rackDimensions.l / 2]}>
                <boxGeometry args={[rackDimensions.w, 0.1, rackDimensions.l]} />
                <meshStandardMaterial color="#1a1a1e" transparent opacity={0.6} />
            </mesh>

            {/* Wireframe Outline */}
            <mesh position={[0, rackDimensions.h / 2, rackDimensions.l / 2]}>
                <boxGeometry args={[rackDimensions.w, rackDimensions.h, rackDimensions.l]} />
                <meshLambertMaterial wireframe color="#f97316" transparent opacity={0.2} />
            </mesh>
        </group>
    )
}
