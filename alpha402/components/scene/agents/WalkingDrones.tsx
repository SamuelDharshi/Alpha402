'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AGENT_POSITIONS, AGENT_COLORS } from '@/lib/types'
import type { AgentId } from '@/lib/types'

interface Drone {
  agentId: AgentId
  color: string
  speed: number
  bobOffset: number
  pathOffset: number
  size: number
}

const TOWER_POSITIONS = Object.entries(AGENT_POSITIONS).map(([id, pos]) => ({
  id: id as AgentId,
  pos: new THREE.Vector3(pos[0], 0.8, pos[2]),
}))

export default function WalkingDrones() {
  const drones = useMemo<Drone[]>(() => {
    const agentIds: AgentId[] = ['commander', 'intel', 'risk', 'execution']
    const items: Drone[] = []
    agentIds.forEach(id => {
      for (let j = 0; j < 2; j++) {
        items.push({
          agentId: id,
          color: AGENT_COLORS[id],
          speed: 0.3 + Math.random() * 0.4,
          bobOffset: Math.random() * Math.PI * 2,
          pathOffset: Math.random(),
          size: 0.08 + Math.random() * 0.06,
        })
      }
    })
    return items
  }, [])

  const droneRefs = useRef<Array<THREE.Object3D | null>>([])
  const lightRefs = useRef<Array<THREE.PointLight | null>>([])
  const pathProgress = useRef<number[]>(drones.map(d => d.pathOffset))
  const pathTargets = useRef<number[]>(drones.map(() => Math.floor(Math.random() * 4)))

  useFrame((_, delta) => {
    drones.forEach((drone, i) => {
      const group = droneRefs.current[i]
      const light = lightRefs.current[i]
      if (!group) return

      pathProgress.current[i] += delta * drone.speed * 0.5

      if (pathProgress.current[i] >= 1) {
        pathProgress.current[i] = 0
        pathTargets.current[i] = Math.floor(Math.random() * TOWER_POSITIONS.length)
      }

      const targetTower = TOWER_POSITIONS[pathTargets.current[i]]
      const nextTarget = TOWER_POSITIONS[(pathTargets.current[i] + 1) % TOWER_POSITIONS.length]

      const t = pathProgress.current[i]
      group.position.x = THREE.MathUtils.lerp(targetTower.pos.x, nextTarget.pos.x, t)
      group.position.z = THREE.MathUtils.lerp(targetTower.pos.z, nextTarget.pos.z, t)
      group.position.y = 0.8 + Math.sin(Date.now() * 0.002 + drone.bobOffset) * 0.15

      // Face direction of travel
      const dir = new THREE.Vector3(
        nextTarget.pos.x - targetTower.pos.x,
        0,
        nextTarget.pos.z - targetTower.pos.z
      ).normalize()
      if (dir.length() > 0) {
        group.rotation.y = Math.atan2(dir.x, dir.z)
      }

      if (light) {
        light.intensity = 0.3 + Math.sin(Date.now() * 0.003 + drone.bobOffset) * 0.1
      }
    })
  })

  return (
    <group>
      {drones.map((drone, i) => (
        <group key={i} ref={el => { if (el) droneRefs.current[i] = el as unknown as THREE.Object3D }}>
          {/* Drone body — flat disc */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[drone.size, drone.size * 0.7, drone.size * 0.4, 8]} />
            <meshStandardMaterial
              color={drone.color}
              emissive={drone.color}
              emissiveIntensity={0.6}
              metalness={0.9}
            />
          </mesh>

          {/* 4 rotors */}
          {[0, 1, 2, 3].map(r => (
            <mesh
              key={r}
              position={[
                Math.cos((r / 4) * Math.PI * 2) * drone.size * 1.2,
                0,
                Math.sin((r / 4) * Math.PI * 2) * drone.size * 1.2,
              ]}
            >
              <cylinderGeometry args={[drone.size * 0.4, drone.size * 0.4, 0.01, 6]} />
              <meshStandardMaterial
                color={drone.color}
                emissive={drone.color}
                emissiveIntensity={1}
                transparent
                opacity={0.5}
              />
            </mesh>
          ))}

          {/* Trail light */}
          <pointLight
            ref={el => { if (el) lightRefs.current[i] = el as unknown as THREE.PointLight }}
            color={drone.color}
            intensity={0.4}
            distance={1.5}
          />
        </group>
      ))}
    </group>
  )
}
