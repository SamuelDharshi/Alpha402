'use client'
import { useMemo } from 'react'
import * as THREE from 'three'

export default function FloorGrid() {
  const tiles = useMemo(() => {
    const items = []
    for (let x = -5; x <= 6; x++) {
      for (let z = -5; z <= 6; z++) {
        const isGlow = (Math.abs(x) + Math.abs(z)) % 3 === 0
        items.push({ x, z, isGlow })
      }
    }
    return items
  }, [])

  return (
    <group>
      {tiles.map(({ x, z, isGlow }) => (
        <mesh key={`${x}-${z}`} position={[x, -0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial
            color={isGlow ? '#0A1A3D' : '#0D1220'}
            emissive={isGlow ? '#0A1A3D' : '#000000'}
            emissiveIntensity={isGlow ? 0.4 : 0}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}
