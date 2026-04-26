'use client'
import React from 'react'
import { Float, Edges, Html } from '@react-three/drei'
import { useAlphaStore } from '@/lib/store'
import { AGENT_COLORS } from '@/lib/types'

export default function ExecutionTower({ position, firing }: { position: [number, number, number], firing?: boolean }) {
  const status = useAlphaStore(state => state.agentStates.execution?.status)
  const isActive = status === 'ACTIVE' || firing
  const color = AGENT_COLORS.execution

  return (
    <group position={position}>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.5, 0.4, 1.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[0.5, 3, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 2 : 0.5} />
          <Edges color="#FFFFFF" />
        </mesh>
      </group>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 4.5, 0]}>
          <mesh>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isActive ? 3 : 1} 
            />
          </mesh>
          <Html distanceFactor={10} position={[0, 0.8, 0]} center>
            <div className="px-2 py-1 bg-background-secondary border border-background-tertiary rounded text-[10px] font-mono text-text-mono whitespace-nowrap neon-border">
              EXECUTION
            </div>
          </Html>
        </group>
      </Float>
      <pointLight position={[0, 2, 0]} color={color} intensity={isActive ? 5 : 1} distance={5} />
    </group>
  )
}
