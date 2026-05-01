'use client'
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'

interface Coin {
  id: string
  progress: number
  txHash: string
  success: boolean
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  color: string
}

export default function TxCoins() {
  const messages = useAlphaStore(state => state.messages)
  const coinsRef = useRef<Coin[]>([])
  const meshRefs = useRef<THREE.Mesh[]>([])
  const [, forceRender] = useState(0)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return
    if (last.type === 'EXECUTION_CONFIRMED' || last.type === 'EXECUTION_FAILED') {
      const success = last.type === 'EXECUTION_CONFIRMED'
      coinsRef.current.push({
        id: last.id,
        progress: 0,
        txHash: String(last.payload?.txHash || '0x???').slice(0, 10),
        success,
        startPos: new THREE.Vector3(0, 0.5, -3),
        endPos: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          4 + Math.random() * 2,
          (Math.random() - 0.5) * 4
        ),
        color: success ? '#00FF88' : '#EF4444',
      })
      if (coinsRef.current.length > 8) coinsRef.current.shift()
      forceRender(t => t + 1)
    }
  }, [messages])

  useFrame((_, delta) => {
    let changed = false
    coinsRef.current.forEach((coin, i) => {
      coin.progress += delta * 0.6
      const mesh = meshRefs.current[i]
      if (!mesh) return
      // Arc trajectory
      const t = Math.min(coin.progress, 1)
      mesh.position.lerpVectors(coin.startPos, coin.endPos, t)
      mesh.position.y += Math.sin(t * Math.PI) * 1.5
      mesh.rotation.y += delta * 3
      mesh.rotation.z += delta * 2
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.opacity = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2
      changed = true
    })
    coinsRef.current = coinsRef.current.filter(c => c.progress < 1.1)
    if (changed) forceRender(t => t + 1)
  })

  return (
    <group>
      {coinsRef.current.map((coin, i) => (
        <mesh
          key={coin.id}
          ref={el => { if (el) meshRefs.current[i] = el }}
          position={coin.startPos.clone()}
        >
          <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
          <meshStandardMaterial
            color={coin.color}
            emissive={coin.color}
            emissiveIntensity={1.2}
            metalness={1}
            roughness={0}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  )
}
