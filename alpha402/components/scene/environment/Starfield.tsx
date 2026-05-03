'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Starfield() {
  const starsRef = useRef<THREE.Points>(null)
  const nebulaRef = useRef<THREE.Points>(null)

  const { starPositions, starColors } = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 40 + Math.random() * 20
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Mix of white, blue, cyan stars
      const type = Math.random()
      if (type < 0.6) { col[i * 3] = 0.8; col[i * 3 + 1] = 0.9; col[i * 3 + 2] = 1.0 }
      else if (type < 0.8) { col[i * 3] = 0.3; col[i * 3 + 1] = 0.6; col[i * 3 + 2] = 1.0 }
      else { col[i * 3] = 0; col[i * 3 + 1] = 0.96; col[i * 3 + 2] = 1.0 }
    }
    return { starPositions: pos, starColors: col }
  }, [])

  const nebulaPositions = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = 10 + Math.random() * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return pos
  }, [])

  // Twinkling
  useFrame(({ clock }) => {
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 0.5) * 0.05
    }
  })

  return (
    <group>
      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Nebula cloud */}
      <points ref={nebulaRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebulaPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#1E3A6E"
          size={1.2}
          transparent
          opacity={0.12}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}
