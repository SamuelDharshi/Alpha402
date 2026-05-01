'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'

// Base scene
import FloorGrid from './FloorGrid'
import CommanderTower from './towers/CommanderTower'
import IntelTower from './towers/IntelTower'
import RiskTower from './towers/RiskTower'
import ExecutionTower from './towers/ExecutionTower'
import MessageBeam from './MessageBeam'

// NEW: 9 enhanced features
import CitySkyline from './city/CitySkyline'
import WalkingDrones from './agents/WalkingDrones'
import DataOrbs from './data/DataOrbs'
import DebateRing from './council/DebateRing'
import LimitOrderTowers from './trading/LimitOrderTowers'
import EnergyGrid from './environment/EnergyGrid'
import TxCoins from './trading/TxCoins'
import Starfield from './environment/Starfield'
import CinematicCamera from './camera/CinematicCamera'

// Store
import { useAlphaStore } from '@/lib/store'

interface Props {
  autoRotate?: boolean
  compact?: boolean
}

export default function TradingFloorCanvas({ autoRotate = true, compact = false }: Props) {
  const zoom = compact ? 28 : 55
  const activeBeams = useAlphaStore(state => state.activeBeams)
  const messages = useAlphaStore(state => state.messages)

  const lastMessage = messages[messages.length - 1]
  const execFiring = lastMessage?.type === 'EXECUTION_CONFIRMED' &&
    (Date.now() - (typeof lastMessage.timestamp === 'number' ? lastMessage.timestamp : Date.now())) < 3000

  return (
    <Canvas
      orthographic
      camera={{ zoom, position: [10, 10, 10], near: 0.1, far: 200 }}
      style={{ background: '#080C14', width: '100%', height: '100%' }}
      dpr={compact ? 1 : [1, 2]}
    >
      {/* Environment */}
      <fog attach="fog" args={['#080C14', 25, 80]} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 10, 5]} intensity={0.3} color="#1E6FFF" />

      <Suspense fallback={null}>
        {/* === ENVIRONMENT LAYER === */}
        <Starfield />
        <CitySkyline />
        <EnergyGrid />

        {/* === FLOOR LAYER === */}
        <FloorGrid />

        {/* === AGENT TOWERS === */}
        <CommanderTower position={[0, 0, 0]} />
        <IntelTower position={[-3, 0, 3]} />
        <RiskTower position={[3, 0, 3]} />
        <ExecutionTower position={[0, 0, -3]} firing={execFiring} />

        {/* === INTERACTIVE LAYER === */}
        <DebateRing />
        <LimitOrderTowers />
        <DataOrbs />
        <WalkingDrones />
        <TxCoins />

        {/* === MESSAGE BEAMS === */}
        {activeBeams.map(beam => (
          <MessageBeam key={beam.id} {...beam} />
        ))}
      </Suspense>

      {/* === CAMERA === */}
      <CinematicCamera />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.8}
      />

      {/* === POSTPROCESSING === */}
    </Canvas>
  )
}
