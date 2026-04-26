'use client'
import React from 'react'
import { Float, Edges, Html } from '@react-three/drei'
import { useAlphaStore } from '@/lib/store'
import { AGENT_COLORS } from '@/lib/types'

export default function CommanderTower({ position }: { position: [number, number, number] }) {
  const status = useAlphaStore(state => state.agentStates.commander?.status)
  const isActive = status === 'ACTIVE'
  const color = AGENT_COLORS.commander

  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 2 : 0.5} />
        <Edges color="#00F5FF" />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.05, 16, 100]} />
            <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={2} transparent opacity={0.6} />
          </mesh>
        </Float>
      </mesh>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 4.5, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isActive ? 3 : 1} 
            />
          </mesh>
          <Html distanceFactor={10} position={[0, 0.8, 0]} center>
            <div className="px-2 py-1 bg-background-secondary border border-background-tertiary rounded text-[10px] font-mono text-text-mono whitespace-nowrap neon-border">
              COMMANDER
            </div>
          </Html>
        </group>
      </Float>
      <pointLight position={[0, 2, 0]} color={color} intensity={isActive ? 5 : 1} distance={5} />
    </group>
  )
}
