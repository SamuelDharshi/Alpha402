'use client'
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'
import { AGENT_COLORS } from '@/lib/types'

const RotatingRadar = ({ color }: { color: string }) => {
  const meshRef = useRef<THREE.Group>(null!)
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5
    }
  })

  return (
    <group ref={meshRef}>
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial color={color} emissive={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function IntelTower({ position }: { position: [number, number, number] }) {
  const status = useAlphaStore(state => state.agentStates.intel?.status)
  const isActive = status === 'ACTIVE'
  const color = AGENT_COLORS.intel

  return (
    <group position={position}>
      <group position={[0, 2.5, 0]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[0, i * 0.4 - 2, 0]}>
            <torusGeometry args={[0.4 - i * 0.03, 0.05, 8, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
        ))}
        <group position={[0, 2.2, 0]}>
          <RotatingRadar color={color} />
        </group>
      </group>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 5.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isActive ? 3 : 1} 
              wireframe
            />
          </mesh>
          <Html distanceFactor={10} position={[0, 0.8, 0]} center>
            <div className="px-2 py-1 bg-background-secondary border border-background-tertiary rounded text-[10px] font-mono text-text-mono whitespace-nowrap neon-border">
              INTEL
            </div>
          </Html>
        </group>
      </Float>
      <pointLight position={[0, 2, 0]} color={color} intensity={isActive ? 5 : 1} distance={5} />
    </group>
  )
}
