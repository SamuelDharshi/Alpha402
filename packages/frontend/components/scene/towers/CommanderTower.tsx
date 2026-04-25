'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import * as THREE from 'three'

interface Props { position: [number, number, number] }

export default function CommanderTower({ position }: Props) {
  const ringRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const pulseRef = useRef(0)

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5
      ringRef.current.rotation.x += delta * 0.2
    }
    pulseRef.current += delta
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(pulseRef.current * 2) * 0.5
    }
  })

  return (
    <group position={position}>
      {/* Main octagonal tower — using CylinderGeometry with 8 sides */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.65, 4, 8]} />
        <meshStandardMaterial
          color="#1E6FFF"
          emissive="#1E6FFF"
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Top platform */}
      <mesh position={[0, 4.1, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.2, 8]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.6} />
      </mesh>

      {/* Orbiting holographic ring */}
      <mesh ref={ringRef} position={[0, 4.5, 0]}>
        <torusGeometry args={[0.8, 0.04, 8, 32]} />
        <meshStandardMaterial
          color="#00F5FF"
          emissive="#00F5FF"
          emissiveIntensity={1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Point light pulse */}
      <pointLight ref={lightRef} position={[0, 4, 0]} color="#1E6FFF" intensity={2} distance={5} />

      {/* Label */}
      <Html position={[0, 5.5, 0]} center>
        <div style={{
          background: 'rgba(13,18,32,0.9)',
          border: '0.5px solid #1E6FFF',
          color: '#7BBFFF',
          fontFamily: 'monospace',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 8px rgba(30,111,255,0.4)'
        }}>
          ● CMD
        </div>
      </Html>
    </group>
  )
}
