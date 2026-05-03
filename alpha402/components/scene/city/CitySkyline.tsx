'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Building {
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
  emissive: string
  windowColor: string
  hasAntenna: boolean
  rotY: number
}

const CITY_COLORS = [
  { base: '#0D1220', emissive: '#1E6FFF', window: '#3B82F6' },
  { base: '#0A1A3D', emissive: '#00F5FF', window: '#00D4E8' },
  { base: '#0D1220', emissive: '#F59E0B', window: '#FCD34D' },
  { base: '#111827', emissive: '#6366F1', window: '#818CF8' },
  { base: '#0D1220', emissive: '#00FF88', window: '#34D399' },
]

export default function CitySkyline() {
  const buildings = useMemo<Building[]>(() => {
    const rng = (seed: number) => {
      let s = seed
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
    }
    const rand = rng(42)
    const items: Building[] = []

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + rand() * 0.3
      const radius = 11 + rand() * 5
      const palette = CITY_COLORS[Math.floor(rand() * CITY_COLORS.length)]
      items.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        width: 0.4 + rand() * 0.8,
        depth: 0.4 + rand() * 0.8,
        height: 1.5 + rand() * 6,
        color: palette.base,
        emissive: palette.emissive,
        windowColor: palette.window,
        hasAntenna: rand() > 0.6,
        rotY: rand() * Math.PI * 2,
      })
    }
    return items
  }, [])

  // Window flicker animation
  const windowMeshes = useRef<THREE.Mesh[]>([])
  const flickerTimers = useRef<number[]>(buildings.map(() => Math.random() * 3))

  useFrame((_, delta) => {
    windowMeshes.current.forEach((mesh, i) => {
      if (!mesh) return
      flickerTimers.current[i] -= delta
      if (flickerTimers.current[i] <= 0) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.2 + Math.random() * 0.6
        flickerTimers.current[i] = 0.5 + Math.random() * 4
      }
    })
  })

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rotY, 0]}>
          {/* Main building body */}
          <mesh position={[0, b.height / 2, 0]} castShadow>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.emissive}
              emissiveIntensity={0.08}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Window grid — emissive planes on building face */}
          <mesh
            ref={el => { if (el) windowMeshes.current[i] = el }}
            position={[b.width / 2 + 0.01, b.height * 0.5, 0]}
          >
            <planeGeometry args={[b.depth * 0.8, b.height * 0.7]} />
            <meshStandardMaterial
              color={b.windowColor}
              emissive={b.windowColor}
              emissiveIntensity={0.4}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Top light */}
          <mesh position={[0, b.height + 0.1, 0]}>
            <boxGeometry args={[b.width, 0.08, b.depth]} />
            <meshStandardMaterial
              color={b.emissive}
              emissive={b.emissive}
              emissiveIntensity={1.5}
            />
          </mesh>

          {/* Antenna (some buildings) */}
          {b.hasAntenna && (
            <mesh position={[0, b.height + 0.8, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.6, 4]} />
              <meshStandardMaterial
                color="#00F5FF"
                emissive="#00F5FF"
                emissiveIntensity={0.8}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}
