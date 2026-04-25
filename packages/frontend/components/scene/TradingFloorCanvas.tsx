'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, Text } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Suspense, useRef } from 'react'
import { Vector2 } from 'three'
import FloorGrid from './FloorGrid'
import CommanderTower from './towers/CommanderTower'
import IntelTower from './towers/IntelTower'
import RiskTower from './towers/RiskTower'
import ExecutionTower from './towers/ExecutionTower'
import { useTradeDeskStore } from '@/lib/store'
import MessageBeam from './MessageBeam'

interface Props {
  autoRotate?: boolean
  compact?: boolean
}

export default function TradingFloorCanvas({ autoRotate = true, compact = false }: Props) {
  const zoom = compact ? 40 : 60
  const activeBeams = useTradeDeskStore(state => state.activeBeams)
  const messages = useTradeDeskStore(state => state.messages)
  const lastMessage = messages[messages.length - 1]
  const execFiring = lastMessage?.type === 'EXECUTION_CONFIRMED' &&
    Date.now() - lastMessage.timestamp < 3000

  return (
    <Canvas
      orthographic
      camera={{ zoom, position: [10, 10, 10], near: 0.1, far: 1000 }}
      style={{ background: '#080C14', width: '100%', height: '100%' }}
    >
      <fog attach="fog" args={['#080C14', 20, 60]} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 10, 5]} intensity={0.3} color="#1E6FFF" />

      <Suspense fallback={null}>
        <FloorGrid />
        <CommanderTower position={[0, 0, 0]} />
        <IntelTower position={[-3, 0, 3]} />
        <RiskTower position={[3, 0, 3]} />
        <ExecutionTower position={[0, 0, -3]} firing={execFiring} />
        {activeBeams.map(beam => (
          <MessageBeam key={beam.id} {...beam} />
        ))}
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 3}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          intensity={1.2}
          blendFunction={BlendFunction.ADD}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.002, 0.002)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </Canvas>
  )
}
