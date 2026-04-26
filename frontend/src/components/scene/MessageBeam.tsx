'use client'
import React, { useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { AGENT_POSITIONS, AGENT_COLORS, AgentId } from '@/lib/types'

interface MessageBeamProps {
  sender: AgentId
  receiver: AgentId
}

export default function MessageBeam({ sender, receiver }: MessageBeamProps) {
  const start = AGENT_POSITIONS[sender]
  const end = AGENT_POSITIONS[receiver]
  const color = AGENT_COLORS[sender]
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const duration = 1500
    const animate = () => {
      const now = Date.now()
      const p = Math.min((now - startTime) / duration, 1)
      setProgress(p)
      if (p < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [])

  const curve = useMemo(() => {
    const vStart = new THREE.Vector3(start[0], 4, start[2])
    const vEnd = new THREE.Vector3(end[0], 4, end[2])
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5)
    mid.y += 2
    return new THREE.QuadraticBezierCurve3(vStart, mid, vEnd)
  }, [start, end])

  const points = useMemo(() => curve.getPoints(50), [curve])
  if (progress >= 1) return null

  return (
    <group>
      <line>
        <bufferGeometry attach="geometry" setFromPoints={points} />
        <lineBasicMaterial attach="material" color={color} transparent opacity={0.3 * (1 - progress)} />
      </line>
      <mesh position={curve.getPoint(progress)}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
      </mesh>
    </group>
  )
}
