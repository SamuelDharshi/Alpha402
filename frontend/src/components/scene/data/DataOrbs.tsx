'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'

const PAIRS = ['ETH/USDC', 'BTC/ETH', 'ARB/USDC', 'UNI/ETH', 'OP/USDC', 'LINK/ETH']
const INTEL_POS = new THREE.Vector3(-3, 3, 3)

export default function DataOrbs() {
  const orbRefs = useRef<THREE.Mesh[]>([])
  const lineRefs = useRef<THREE.Line[]>([])
  const t = useRef(0)

  const agentStates = useAlphaStore(state => state.agentStates)
  const intelActive = agentStates.intel?.status === 'ACTIVE'

  const orbData = useMemo(() => PAIRS.map((pair, i) => {
    const angle = (i / PAIRS.length) * Math.PI * 2
    const radius = 3.5
    return {
      pair,
      baseX: Math.cos(angle) * radius,
      baseZ: Math.sin(angle) * radius,
      baseY: 2.5 + (i % 2) * 0.8,
      orbitalSpeed: 0.1 + i * 0.03,
      phase: (i / PAIRS.length) * Math.PI * 2,
      color: ['#00F5FF', '#1E6FFF', '#F59E0B', '#10B981', '#6366F1', '#FF00FF'][i],
    }
  }), [])

  useFrame((state, delta) => {
    t.current += delta
    const speed = intelActive ? 2.5 : 1.0

    orbRefs.current.forEach((orb, i) => {
      if (!orb) return
      const data = orbData[i]
      orb.position.x = data.baseX + Math.sin(t.current * data.orbitalSpeed + data.phase) * 0.3
      orb.position.y = data.baseY + Math.cos(t.current * 0.8 + data.phase) * 0.2
      orb.position.z = data.baseZ + Math.cos(t.current * data.orbitalSpeed + data.phase) * 0.3
      orb.scale.setScalar(1 + Math.sin(t.current * speed + data.phase) * 0.15)

      const mat = orb.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = intelActive
        ? 0.8 + Math.sin(t.current * 4 + data.phase) * 0.4
        : 0.3 + Math.sin(t.current + data.phase) * 0.1

      // Update line to follow orb
      const line = lineRefs.current[i]
      if (line) {
        const positions = line.geometry.attributes.position
        positions.setXYZ(0, orb.position.x, orb.position.y, orb.position.z)
        positions.needsUpdate = true
      }
    })
  })

  return (
    <group>
      {orbData.map((orb, i) => (
        <group key={i}>
          {/* Orb sphere */}
          <mesh
            ref={el => { if (el) orbRefs.current[i] = el }}
            position={[orb.baseX, orb.baseY, orb.baseZ]}
          >
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.85}
              metalness={0.3}
            />
          </mesh>

          {/* Wireframe shell around orb */}
          <mesh position={[orb.baseX, orb.baseY, orb.baseZ]}>
            <sphereGeometry args={[0.24, 8, 8]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.3}
              wireframe
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Label */}
          <Html position={[orb.baseX, orb.baseY + 0.4, orb.baseZ]} center>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              color: orb.color,
              background: 'rgba(8,12,20,0.85)',
              border: `0.5px solid ${orb.color}44`,
              padding: '1px 5px',
              borderRadius: '2px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}>
              {orb.pair}
            </div>
          </Html>

          {/* Beam line to Intel tower */}
          <line ref={el => { if (el) lineRefs.current[i] = el as unknown as THREE.Line }}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([
                  orb.baseX, orb.baseY, orb.baseZ,
                  INTEL_POS.x, INTEL_POS.y, INTEL_POS.z
                ]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={orb.color}
              transparent
              opacity={0.15}
            />
          </line>
        </group>
      ))}
    </group>
  )
}
