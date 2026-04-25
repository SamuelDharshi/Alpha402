'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  verdict?: 'approved' | 'rejected' | null
}

export default function RiskTower({ position, verdict = null }: Props) {
  const lightRef = useRef<THREE.PointLight>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    if (lightRef.current) {
      const base = verdict === 'approved' ? '#10B981' : verdict === 'rejected' ? '#EF4444' : '#F59E0B'
      lightRef.current.color.set(base)
      lightRef.current.intensity = 1 + Math.sin(t.current * 3) * 0.4
    }
  })

  const color = verdict === 'approved' ? '#10B981' : verdict === 'rejected' ? '#EF4444' : '#F59E0B'

  return (
    <group position={position}>
      {/* Fortress base */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.2, 2.5, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Buttresses */}
      {[[-0.7, 0, 0], [0.7, 0, 0], [0, 0, -0.7], [0, 0, 0.7]].map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, 0.8, bz]}>
          <boxGeometry args={[0.2, 1.6, 0.2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      ))}

      {/* Warning chevrons (top faces) */}
      <mesh position={[0, 2.6, 0]}>
        <octahedronGeometry args={[0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} wireframe />
      </mesh>

      <pointLight ref={lightRef} position={[0, 2, 0]} color={color} intensity={1.5} distance={4} />

      <Html position={[0, 3.5, 0]} center>
        <div style={{
          background: 'rgba(13,18,32,0.9)',
          border: `0.5px solid ${color}`,
          color: color,
          fontFamily: 'monospace',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 8px ${color}66`
        }}>
          ⬡ RISK
        </div>
      </Html>
    </group>
  )
}
