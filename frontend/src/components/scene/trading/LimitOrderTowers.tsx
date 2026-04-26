'use client'
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'

interface OrderTower {
  id: string
  x: number
  z: number
  color: string
  label: string
  status: 'pending' | 'executing' | 'done'
  spawnTime: number
}

const SPAWN_POSITIONS: [number, number][] = [
  [-1.5, 1.5], [1.5, 1.5], [-1.5, -1.5], [1.5, -1.5], [0, 2],
]

export default function LimitOrderTowers() {
  const [orders, setOrders] = useState<OrderTower[]>([])
  const messages = useAlphaStore(state => state.messages)
  const towerRefs = useRef<THREE.Group[]>([])
  const t = useRef(0)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return

    if (last.type === 'TRIGGER_FIRED') {
      const posIndex = orders.length % SPAWN_POSITIONS.length
      const [x, z] = SPAWN_POSITIONS[posIndex]
      const newOrder: OrderTower = {
        id: last.id,
        x,
        z,
        color: '#F59E0B',
        label: `TRIGGER\n$${(last.payload?.currentValue as number)?.toFixed(0) || '???'}`,
        status: 'pending',
        spawnTime: Date.now(),
      }
      setOrders(prev => [...prev.slice(-4), newOrder])
    }

    if (last.type === 'EXECUTION_SUBMITTED') {
      setOrders(prev => prev.map(o =>
        o.status === 'pending' ? { ...o, status: 'executing', color: '#6366F1' } : o
      ))
    }

    if (last.type === 'EXECUTION_CONFIRMED') {
      setOrders(prev => prev.map(o =>
        o.status === 'executing' ? { ...o, status: 'done', color: '#10B981' } : o
      ))
      setTimeout(() => setOrders(prev => prev.filter(o => o.status !== 'done')), 3000)
    }
  }, [messages])

  useFrame((_, delta) => {
    t.current += delta
    towerRefs.current.forEach((group, i) => {
      if (!group || !orders[i]) return
      const order = orders[i]
      // Bounce up on spawn
      const age = (Date.now() - order.spawnTime) / 1000
      const bounceY = age < 0.5 ? Math.sin(age * Math.PI * 2) * 0.3 : 0
      group.position.y = bounceY
      // Rotate slowly
      group.rotation.y += delta * (order.status === 'executing' ? 2 : 0.5)
    })
  })

  return (
    <group>
      {orders.map((order, i) => (
        <group
          key={order.id}
          ref={el => { if (el) towerRefs.current[i] = el }}
          position={[order.x, 0, order.z]}
        >
          {/* Obelisk base */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 0.3, 6]} />
            <meshStandardMaterial
              color={order.color}
              emissive={order.color}
              emissiveIntensity={0.3}
              metalness={0.8}
            />
          </mesh>

          {/* Obelisk body */}
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.06, 0.12, 0.9, 6]} />
            <meshStandardMaterial
              color={order.color}
              emissive={order.color}
              emissiveIntensity={0.5}
              metalness={0.9}
            />
          </mesh>

          {/* Obelisk tip */}
          <mesh position={[0, 1.25, 0]}>
            <coneGeometry args={[0.06, 0.25, 6]} />
            <meshStandardMaterial
              color={order.color}
              emissive={order.color}
              emissiveIntensity={1.2}
            />
          </mesh>

          {/* Status ring at base */}
          <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.02, 6, 24]} />
            <meshStandardMaterial
              color={order.color}
              emissive={order.color}
              emissiveIntensity={1}
            />
          </mesh>

          {/* Label */}
          <Html position={[0, 1.7, 0]} center>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '8px',
              color: order.color,
              background: 'rgba(8,12,20,0.9)',
              border: `0.5px solid ${order.color}66`,
              padding: '2px 5px',
              borderRadius: '2px',
              textAlign: 'center',
              whiteSpace: 'pre',
              pointerEvents: 'none',
              boxShadow: `0 0 6px ${order.color}44`,
            }}>
              {order.label}
            </div>
          </Html>

          <pointLight color={order.color} intensity={0.6} distance={2} position={[0, 1, 0]} />
        </group>
      ))}
    </group>
  )
}
