import React, { Suspense, useMemo } from 'react'
import { Canvas, invalidate } from '@react-three/fiber'
import { OrbitControls, Sky, ContactShadows, Environment } from '@react-three/drei'
import { Location3D } from './3D/Location3D'
import { SKUInstances } from './3D/SKUInstances'
import { solveAutoLayout } from '../engine/stackingEngine'

/**
 * Main 3D Visualizer Component.
 */
export function Warehouse3DVisualizer({ inventory, locationsMap, skuMap, onGoBack }) {
    // 1. Process locations and inventory for 3D
    const sceneData = useMemo(() => {
        const data = []

        Object.entries(inventory).forEach(([locId, items], index) => {
            const locMeta = locationsMap[locId] || { length: 20, lengthIn: 0, widthFt: 8, widthIn: 0 }

            // Calculate world position (grid layout)
            const row = Math.floor(index / 8)
            const col = index % 8
            const spacing = 18 // feet

            // RUN THE STACKING ENGINE to get coordinates
            const plan = solveAutoLayout(
                {
                    row: locId,
                    length: locMeta.length || 0,
                    lengthIn: locMeta.lengthIn || 0,
                    widthFt: locMeta.widthFt || 8,
                    widthIn: locMeta.widthIn || 0
                },
                skuMap,
                items
            )

            data.push({
                id: locId,
                position: [col * spacing, 0, row * spacing],
                meta: locMeta,
                placements: plan.placements || []
            })
        })
        return data
    }, [inventory, locationsMap, skuMap])

    return (
        <div className="w-full h-full bg-[#050507] relative">
            {/* Back Button */}
            <button
                onClick={onGoBack}
                className="absolute top-6 right-6 z-10 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/80 transition-all backdrop-blur-md active:scale-95"
            >
                ← Volver al Plano 2D
            </button>

            <Canvas
                shadows
                frameloop="demand"
                camera={{ position: [60, 40, 60], fov: 40 }}
                onCreated={({ gl }) => {
                    gl.setPixelRatio(window.devicePixelRatio)
                }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.3} />
                    <spotLight position={[150, 150, 150]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
                    <pointLight position={[-100, 50, -100]} intensity={0.5} />

                    <Sky distance={450000} sunPosition={[0, -1, 0]} inclination={0} azimuth={0.25} />
                    <Environment preset="night" />

                    <group position={[-60, 0, -60]}>
                        {sceneData.map((d) => (
                            <group key={d.id} position={d.position}>
                                <Location3D
                                    location={d.meta}
                                    itemsAtLocation={d.placements}
                                    skuMap={skuMap}
                                />
                                <SKUInstances
                                    items={d.placements}
                                    skuMap={skuMap}
                                    locationPosition={{ x: d.position[0], y: d.position[1], z: d.position[2] }}
                                />
                            </group>
                        ))}
                    </group>

                    <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={300} blur={2.5} far={30} />
                    <OrbitControls makeDefault minDistance={10} maxDistance={200} onChange={() => invalidate()} />
                </Suspense>
            </Canvas>

            <div className="absolute bottom-10 left-10 pointer-events-none">
                <h1 className="text-4xl font-black text-white/20 tracking-tighter uppercase italic">Pickd Visualizer</h1>
                <p className="text-[10px] text-orange-500/50 font-mono tracking-[0.4em] font-bold uppercase mt-[-10px] ml-1">Real-Time Industrial GPU Engine</p>
            </div>
        </div>
    )
}

