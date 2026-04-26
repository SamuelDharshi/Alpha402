'use client'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'

export default function DebateRing() {
  const messages = useAlphaStore(state => state.messages)
  const ringRef = useRef<THREE.Group>(null)
  const innerRingRef = useRef<THREE.Mesh>(null)
  const outerRingRef = useRef<THREE.Mesh>(null)
  const [visible, setVisible] = useState(false)
  const [verdict, setVerdict] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const fadeRef = useRef(0)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return

    if (last.type === 'RISK_SCORING') {
      setVisible(true)
      setVerdict(null)
      setRiskScore(null)
    }
    if (last.type === 'RISK_APPROVED') {
      setVerdict('APPROVE')
      setRiskScore((last.payload?.score as number) || 8)
      setTimeout(() => setVisible(false), 3000)
    }
    if (last.type === 'RISK_REJECTED') {
      setVerdict('REJECT')
      setRiskScore((last.payload?.score as number) || 3)
      setTimeout(() => setVisible(false), 3000)
    }
  }, [messages])

  useFrame((_, delta) => {
    if (visible) fadeRef.current = Math.min(fadeRef.current + delta * 2, 1)
    else fadeRef.current = Math.max(fadeRef.current - delta * 2, 0)

    if (ringRef.current) {
      ringRef.current.rotation.y += delta * (verdict ? 0.2 : 1.2)
      ringRef.current.scale.setScalar(fadeRef.current)
    }
    if (innerRingRef.current) innerRingRef.current.rotation.z += delta * 2
    if (outerRingRef.current) outerRingRef.current.rotation.z -= delta * 1.5
  })

  if (fadeRef.current < 0.01 && !visible) return null

  const ringColor = verdict === 'APPROVE' ? '#10B981' : verdict === 'REJECT' ? '#EF4444' : '#F59E0B'

  return (
    <group ref={ringRef} position={[0, 1.5, 0]}>
      {/* Outer rotating ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[1.8, 0.04, 8, 64]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={1.2}
          transparent
          opacity={fadeRef.current * 0.9}
        />
      </mesh>

      {/* Inner rotating ring (counter) */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.2, 0.03, 8, 48]} />
        <meshStandardMaterial
          color="#00F5FF"
          emissive="#00F5FF"
          emissiveIntensity={0.8}
          transparent
          opacity={fadeRef.current * 0.6}
        />
      </mesh>

      {/* 6 holographic panel segments around the ring */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5]}
            rotation={[0, -angle, 0]}
          >
            <planeGeometry args={[0.4, 0.6]} />
            <meshStandardMaterial
              color={ringColor}
              emissive={ringColor}
              emissiveIntensity={0.4}
              transparent
              opacity={fadeRef.current * 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      {/* Center verdict display */}
      <Html center position={[0, 0.3, 0]}>
        <div style={{
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: fadeRef.current,
          transition: 'opacity 0.3s',
        }}>
          {!verdict ? (
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#F59E0B',
              background: 'rgba(8,12,20,0.9)',
              border: '0.5px solid #F59E0B88',
              padding: '6px 12px',
              borderRadius: '4px',
              animation: 'pulse 1s infinite',
            }}>
              ⬡ RISK SCORING...
            </div>
          ) : (
            <div style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 'bold',
              color: verdict === 'APPROVE' ? '#10B981' : '#EF4444',
              background: 'rgba(8,12,20,0.95)',
              border: `1px solid ${verdict === 'APPROVE' ? '#10B981' : '#EF4444'}`,
              padding: '8px 16px',
              borderRadius: '4px',
              boxShadow: `0 0 20px ${verdict === 'APPROVE' ? '#10B98155' : '#EF444455'}`,
            }}>
              {verdict === 'APPROVE' ? '✓ APPROVED' : '✗ REJECTED'}
              {riskScore && <div style={{ fontSize: '10px', opacity: 0.8 }}>{riskScore}/10</div>}
            </div>
          )}
        </div>
      </Html>

      {/* Point light for ambiance */}
      <pointLight color={ringColor} intensity={fadeRef.current * 2} distance={5} />
    </group>
  )
}
