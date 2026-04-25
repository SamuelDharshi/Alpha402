'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface Props { position: [number, number, number] }

export default function IntelTower({ position }: Props) {
  const dishRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const count = 60
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 0.3 + Math.random() * 0.5
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.random() * 2
      positions[i * 3 + 2] = Math.sin(angle) * radius
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = 0.01 + Math.random() * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return { positions, velocities }
  }, [])

  useFrame((_, delta) => {
    if (dishRef.current) dishRef.current.rotation.y += delta * 0.8
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, pos.getY(i) + particles.velocities[i * 3 + 1])
        if (pos.getY(i) > 3) pos.setY(i, 0)
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      {/* Antenna tower — thin cylinder */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 5, 6]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.5} metalness={0.9} />
      </mesh>

      {/* Stacked rings */}
      {[1, 1.5, 2, 2.5, 3].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.25 + i * 0.05, 0.03, 6, 16]} />
          <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.6} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Radar dish on top */}
      <mesh ref={dishRef} position={[0, 5.3, 0]}>
        <coneGeometry args={[0.4, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.8} wireframe />
      </mesh>

      {/* Particle data stream */}
      <points ref={particlesRef} position={[0, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#00F5FF" size={0.05} transparent opacity={0.7} />
      </points>

      <Html position={[0, 6.2, 0]} center>
        <div style={{
          background: 'rgba(13,18,32,0.9)',
          border: '0.5px solid #00F5FF',
          color: '#00F5FF',
          fontFamily: 'monospace',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 8px rgba(0,245,255,0.4)'
        }}>
          ◉ INTEL
        </div>
      </Html>
    </group>
  )
}
