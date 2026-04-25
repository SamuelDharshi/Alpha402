'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  firing?: boolean
}

export default function ExecutionTower({ position, firing = false }: Props) {
  const rocketRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const t = useRef(0)
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const velocities = useRef<Float32Array>(new Float32Array(200 * 3))
  const active = useRef(false)

  useEffect(() => {
    if (firing && !active.current) {
      active.current = true
      const v = velocities.current
      for (let i = 0; i < 200; i++) {
        v[i * 3] = (Math.random() - 0.5) * 0.15
        v[i * 3 + 1] = 0.1 + Math.random() * 0.2
        v[i * 3 + 2] = (Math.random() - 0.5) * 0.15
      }
      setTimeout(() => { active.current = false }, 2000)
    }
  }, [firing])

  useFrame((_, delta) => {
    t.current += delta
    if (rocketRef.current) {
      rocketRef.current.position.y = 3.5 + Math.sin(t.current * 2) * 0.1
    }
    if (lightRef.current) {
      lightRef.current.intensity = firing
        ? 3 + Math.sin(t.current * 10) * 1
        : 0.5 + Math.sin(t.current) * 0.2
    }

    if (active.current && particlesRef.current) {
      const dummy = new THREE.Object3D()
      const v = velocities.current
      for (let i = 0; i < 200; i++) {
        const m = new THREE.Matrix4()
        particlesRef.current.getMatrixAt(i, m)
        const pos = new THREE.Vector3().setFromMatrixPosition(m)
        pos.x += v[i * 3]
        pos.y += v[i * 3 + 1]
        pos.z += v[i * 3 + 2]
        v[i * 3 + 1] -= 0.003  // gravity
        dummy.position.copy(pos)
        dummy.updateMatrix()
        particlesRef.current.setMatrixAt(i, dummy.matrix)
      }
      particlesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      {/* Launch pad base */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1, 1.1, 0.2, 8]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.2} metalness={0.9} />
      </mesh>

      {/* Pad legs */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i}
          position={[
            Math.cos((i / 4) * Math.PI * 2) * 0.8,
            0.75,
            Math.sin((i / 4) * Math.PI * 2) * 0.8
          ]}
        >
          <cylinderGeometry args={[0.05, 0.05, 1.5, 6]} />
          <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Tower column */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 3, 6]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.4} metalness={0.9} />
      </mesh>

      {/* Rocket */}
      <mesh ref={rocketRef} position={[0, 3.5, 0]}>
        <coneGeometry args={[0.2, 0.8, 6]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.9} />
      </mesh>

      <instancedMesh ref={particlesRef} args={[undefined as any, undefined as any, 200]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.8} />
      </instancedMesh>

      <pointLight ref={lightRef} position={[0, 2, 0]} color="#00FF88" intensity={1} distance={5} />

      <Html position={[0, 4.8, 0]} center>
        <div style={{
          background: 'rgba(13,18,32,0.9)',
          border: '0.5px solid #00FF88',
          color: '#00FF88',
          fontFamily: 'monospace',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 8px rgba(0,255,136,0.4)'
        }}>
          ↑ EXEC
        </div>
      </Html>
    </group>
  )
}
