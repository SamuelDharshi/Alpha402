'use client'
import React from 'react'
import { Float, Edges, Html } from '@react-three/drei'
import { useAlphaStore } from '@/lib/store'
import { AGENT_COLORS } from '@/lib/types'

export default function RiskTower({ position }: { position: [number, number, number] }) {
  const status = useAlphaStore(state => state.agentStates.risk?.status)
  const isActive = status === 'ACTIVE'
  const color = AGENT_COLORS.risk

  return (
    <group position={position}>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.2, 2.5, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 2 : 0.5} />
        <Edges color="#FFFFFF" />
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, -0.5, 0.7]}>
            <boxGeometry args={[0.4, 1.5, 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </mesh>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 4.5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isActive ? 3 : 1} 
            />
          </mesh>
          <Html distanceFactor={10} position={[0, 0.8, 0]} center>
            <div className="px-2 py-1 bg-background-secondary border border-background-tertiary rounded text-[10px] font-mono text-text-mono whitespace-nowrap neon-border">
              RISK
            </div>
          </Html>
        </group>
      </Float>
      <pointLight position={[0, 2, 0]} color={color} intensity={isActive ? 5 : 1} distance={5} />
    </group>
  )
}
