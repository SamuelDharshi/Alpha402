'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AGENT_POSITIONS } from '@/lib/types'
import type { AgentId } from '@/lib/types'

interface Props {
  from: AgentId
  to: AgentId
  color: string
  startTime: number
  duration: number
}

export default function MessageBeam({ from, to, color, startTime, duration }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)

  const fromPos = AGENT_POSITIONS[from]
  const toPos = AGENT_POSITIONS[to]

  const curve = useMemo(() => {
    const start = new THREE.Vector3(fromPos[0], 2, fromPos[2])
    const mid = new THREE.Vector3(
      (fromPos[0] + toPos[0]) / 2,
      4,
      (fromPos[2] + toPos[2]) / 2
    )
    const end = new THREE.Vector3(toPos[0], 2, toPos[2])
    return new THREE.CatmullRomCurve3([start, mid, end])
  }, [fromPos, toPos])

  const particleCount = 20
  const positions = useMemo(() => new Float32Array(particleCount * 3), [])

  useFrame(() => {
    const elapsed = Date.now() - startTime
    progressRef.current = Math.min(elapsed / duration, 1)

    for (let i = 0; i < particleCount; i++) {
      const t = Math.max(0, progressRef.current - (i / particleCount) * 0.4)
      const pt = curve.getPoint(Math.min(t, 1))
      positions[i * 3] = pt.x
      positions[i * 3 + 1] = pt.y
      positions[i * 3 + 2] = pt.z
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  const opacity = 1 - progressRef.current

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        transparent
        opacity={Math.max(opacity, 0)}
        depthWrite={false}
      />
    </points>
  )
}
