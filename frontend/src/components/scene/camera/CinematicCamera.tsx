'use client'
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAlphaStore } from '@/lib/store'
import { AGENT_POSITIONS } from '@/lib/types'

const BASE_ZOOM = 60
const FOCUS_ZOOM = 90
const TRANSITION_SPEED = 2.5

export default function CinematicCamera() {
  const { camera } = useThree()
  const messages = useAlphaStore(state => state.messages)

  const targetZoom = useRef(BASE_ZOOM)
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last) return

    const focusAgent = (
      last.type === 'TRIGGER_FIRED' ? 'intel' :
      last.type === 'RISK_SCORING' ? 'risk' :
      last.type === 'EXECUTION_CONFIRMED' || last.type === 'EXECUTION_SUBMITTED' ? 'execution' :
      last.type === 'STRATEGY_PARSED' ? 'commander' : null
    )

    if (focusAgent) {
      const pos = AGENT_POSITIONS[focusAgent as keyof typeof AGENT_POSITIONS]
      targetLookAt.current.set(pos[0], 1, pos[2])
      targetZoom.current = FOCUS_ZOOM

      if (returnTimer.current) clearTimeout(returnTimer.current)
      returnTimer.current = setTimeout(() => {
        targetLookAt.current.set(0, 0, 0)
        targetZoom.current = BASE_ZOOM
      }, 2500)
    }
  }, [messages])

  useFrame((_, delta) => {
    // Smooth zoom
    const orthoCamera = camera as THREE.OrthographicCamera
    if (orthoCamera.zoom !== undefined) {
      orthoCamera.zoom = THREE.MathUtils.lerp(
        orthoCamera.zoom,
        targetZoom.current,
        delta * TRANSITION_SPEED
      )
      orthoCamera.updateProjectionMatrix()
    }

    // Smooth look-at pan
    currentLookAt.current.lerp(targetLookAt.current, delta * TRANSITION_SPEED)
    camera.lookAt(currentLookAt.current)
  })

  return null
}
