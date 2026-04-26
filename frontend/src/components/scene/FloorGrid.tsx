'use client'
import React from 'react'

export default function FloorGrid() {
  const size = 12
  const divisions = 12
  
  return (
    <group position={[0, -0.01, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0D1220" roughness={0.8} metalness={0.5} />
      </mesh>
      <gridHelper args={[size, divisions, "#1E3A6E", "#111827"]} />
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[(i - 1.5) * 3, 0, (i - 1.5) * 3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#0A1A3D" emissive="#1E3A6E" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}
