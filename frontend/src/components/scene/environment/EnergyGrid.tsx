'use client'
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'

interface Pulse {
  radius: number
  maxRadius: number
  speed: number
  color: string
  opacity: number
  id: string
}

export default function EnergyGrid() {
  const messages = useAlphaStore(state => state.messages)
  const pulses = useRef<Pulse[]>([])
  const ringRefs = useRef<THREE.Mesh[]>([])
  const ambientT = useRef(0)
  const ambientRingRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return
    if (last.type === 'EXECUTION_CONFIRMED') {
      pulses.current.push({ radius: 0.1, maxRadius: 9, speed: 6, color: '#00FF88', opacity: 0.8, id: last.id + 'exec' })
    }
    if (last.type === 'RISK_APPROVED') {
      pulses.current.push({ radius: 0.1, maxRadius: 6, speed: 4, color: '#10B981', opacity: 0.5, id: last.id + 'risk' })
    }
    if (last.type === 'RISK_REJECTED') {
      pulses.current.push({ radius: 0.1, maxRadius: 5, speed: 3, color: '#EF4444', opacity: 0.4, id: last.id + 'rej' })
    }
  }, [messages])

  useFrame((_, delta) => {
    ambientT.current += delta

    // Ambient slow heartbeat ring
    if (ambientRingRef.current) {
      const mat = ambientRingRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.1 + Math.sin(ambientT.current * 0.8) * 0.05
      const scale = 1 + Math.sin(ambientT.current * 0.8) * 0.02
      ambientRingRef.current.scale.set(scale, 1, scale)
    }

    // Advance event pulses
    pulses.current = pulses.current.filter(p => p.radius < p.maxRadius)
    pulses.current.forEach(p => {
      p.radius += delta * p.speed
      p.opacity = (1 - p.radius / p.maxRadius) * 0.8
    })

    // Update ring meshes
    ringRefs.current.forEach((ring, i) => {
      if (!ring || !pulses.current[i]) return
      const pulse = pulses.current[i]
      ring.scale.set(pulse.radius, 1, pulse.radius)
      const mat = ring.material as THREE.MeshStandardMaterial
      mat.opacity = pulse.opacity
      mat.emissive.set(pulse.color)
      mat.color.set(pulse.color)
    })
  })

  return (
    <group position={[0, 0.02, 0]}>
      {/* Ambient heartbeat ring */}
      <mesh ref={ambientRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.03, 4, 64]} />
        <meshStandardMaterial
          color="#1E6FFF"
          emissive="#1E6FFF"
          emissiveIntensity={0.12}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Second ambient ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[7, 0.02, 4, 64]} />
        <meshStandardMaterial
          color="#00F5FF"
          emissive="#00F5FF"
          emissiveIntensity={0.06}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Event pulse rings — up to 5 simultaneous */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} ref={el => { if (el) ringRefs.current[i] = el }} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.04, 4, 64]} />
          <meshStandardMaterial
            color="#00FF88"
            emissive="#00FF88"
            emissiveIntensity={1}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  )
}
