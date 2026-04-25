"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrthographicCamera, 
  OrbitControls, 
  Edges, 
  Html, 
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { Bloom, EffectComposer, ChromaticAberration, Vignette, Scanline } from '@react-three/postprocessing';
import { motion } from 'framer-motion-3d';
import { useTradeDesk, AgentRole } from '@/lib/useTradeDesk';

// Constants for positions
const AGENT_POSITIONS: Record<AgentRole, [number, number, number]> = {
  COMMANDER: [0, 0, 0],
  INTEL: [-3, 0, 3],
  RISK: [3, 0, 3],
  EXECUTION: [0, 0, -3],
};

const AGENT_COLORS: Record<AgentRole, string> = {
  COMMANDER: '#1E6FFF',
  INTEL: '#00F5FF',
  RISK: '#F59E0B',
  EXECUTION: '#00FF88',
};

// --- Sub-components ---

const Grid = () => {
  const size = 12;
  const divisions = 12;
  
  return (
    <group position={[0, -0.01, 0]}>
      {/* Main Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0D1220" roughness={0.8} metalness={0.5} />
      </mesh>
      
      {/* Grid Lines */}
      <gridHelper args={[size, divisions, "#1E3A6E", "#111827"]} />
      
      {/* Glowing Tiles */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[(i - 1.5) * 3, 0, (i - 1.5) * 3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#0A1A3D" emissive="#1E3A6E" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
};

const Tower = ({ role, status }: { role: AgentRole, status: string }) => {
  const pos = AGENT_POSITIONS[role];
  const color = AGENT_COLORS[role];
  const isActive = status === 'ACTIVE';

  return (
    <group position={[pos[0], pos[1], pos[2]]}>
      {/* Tower Base/Body */}
      {role === 'COMMANDER' && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 4, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 2 : 0.5} />
          <Edges color="#00F5FF" />
          
          {/* Holographic Ring */}
          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.05, 16, 100]} />
              <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={2} transparent opacity={0.6} />
            </mesh>
          </Float>
        </mesh>
      )}

      {role === 'INTEL' && (
        <group position={[0, 2.5, 0]}>
          {/* Stacked Rings Tower */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[0, i * 0.4 - 2, 0]}>
              <torusGeometry args={[0.4 - i * 0.03, 0.05, 8, 32]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
          ))}
          {/* Rotating Radar */}
          <group position={[0, 2.2, 0]}>
            <motion.group animate={{ rotateY: Math.PI * 2 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <mesh rotation={[Math.PI / 4, 0, 0]}>
                <circleGeometry args={[0.5, 32]} />
                <meshStandardMaterial color={color} emissive={color} side={THREE.DoubleSide} />
              </mesh>
            </motion.group>
          </group>
        </group>
      )}

      {role === 'RISK' && (
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[1.2, 2.5, 1.2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={status === 'REJECTED' ? 2 : 0.5} />
          <Edges color="#FFFFFF" />
          {/* Buttresses */}
          {[0, 1, 2, 3].map(i => (
            <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, -0.5, 0.7]}>
              <boxGeometry args={[0.4, 1.5, 0.4]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </mesh>
      )}

      {role === 'EXECUTION' && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.5, 0.4, 1.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <coneGeometry args={[0.5, 3, 4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            <Edges color="#FFFFFF" />
          </mesh>
        </group>
      )}

      {/* Avatar */}
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, role === 'INTEL' ? 5.5 : 4.5, 0]}>
          <mesh>
            {role === 'COMMANDER' && <icosahedronGeometry args={[0.4, 0]} />}
            {role === 'INTEL' && <sphereGeometry args={[0.4, 16, 16]} />}
            {role === 'RISK' && <octahedronGeometry args={[0.4, 0]} />}
            {role === 'EXECUTION' && <coneGeometry args={[0.3, 0.6, 4]} />}
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isActive ? 3 : 1} 
              wireframe={role === 'INTEL'} 
            />
          </mesh>
          
          {/* Label */}
          <Html distanceFactor={10} position={[0, 0.8, 0]} center>
            <div className="px-2 py-1 bg-background-secondary border border-background-tertiary rounded text-[10px] font-mono text-text-mono whitespace-nowrap neon-border">
              {role}
            </div>
          </Html>
        </group>
      </Float>

      {/* Point Light */}
      <pointLight position={[0, 2, 0]} color={color} intensity={isActive ? 5 : 1} distance={5} />
    </group>
  );
};

const MessageBeam = ({ sender, receiver }: { sender: AgentRole, receiver: AgentRole }) => {
  const start = AGENT_POSITIONS[sender];
  const end = AGENT_POSITIONS[receiver];
  const color = AGENT_COLORS[sender];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;
    
    const animate = () => {
      const now = Date.now();
      const p = Math.min((now - startTime) / duration, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  const curve = useMemo(() => {
    const vStart = new THREE.Vector3(start[0], 4, start[2]);
    const vEnd = new THREE.Vector3(end[0], 4, end[2]);
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
    mid.y += 2;
    return new THREE.QuadraticBezierCurve3(vStart, mid, vEnd);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(50), [curve]);

  if (progress >= 1) return null;

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
  );
};

const ParticleBurst = ({ position }: { position: [number, number, number] }) => {
  const count = 100;
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        pos: new THREE.Vector3(...position),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.2, (Math.random() - 0.5) * 0.2),
        life: 1.0
      });
    }
    return temp;
  }, [position]);

  useFrame((state, delta) => {
    particles.forEach((p, i) => {
      p.pos.add(p.vel);
      p.vel.y -= 0.005; // gravity
      p.life -= delta * 0.5;
      
      const matrix = new THREE.Matrix4();
      matrix.setPosition(p.pos);
      const s = Math.max(0, p.life * 0.1);
      matrix.scale(new THREE.Vector3(s, s, s));
      mesh.current.setMatrixAt(i, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={2} transparent opacity={0.8} />
    </instancedMesh>
  );
};

export const TradingFloor = ({ miniaturized = false }: { miniaturized?: boolean }) => {
  const { messages, agentStatuses } = useTradeDesk();
  const [activeBeams, setActiveBeams] = useState<{id: string, sender: AgentRole, receiver: AgentRole}[]>([]);
  const [bursts, setBursts] = useState<{id: string, pos: [number, number, number]}[]>([]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[0];
      const beamId = Math.random().toString(36);
      setActiveBeams(prev => [...prev, { id: beamId, sender: lastMsg.sender, receiver: lastMsg.receiver }]);
      
      if (lastMsg.type === 'TX_CONFIRMED' || lastMsg.type === 'EXECUTION_CONFIRMED') {
        const burstId = Math.random().toString(36);
        setBursts(prev => [...prev, { id: burstId, pos: AGENT_POSITIONS.EXECUTION }]);
        setTimeout(() => setBursts(prev => prev.filter(b => b.id !== burstId)), 2000);
      }

      setTimeout(() => {
        setActiveBeams(prev => prev.filter(b => b.id !== beamId));
      }, 1500);
    }
  }, [messages]);

  return (
    <div className="w-full h-full relative">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={["#080C14"]} />
        <fogExp2 attach="fog" args={["#080C14", 0.05]} />
        
        <OrthographicCamera 
          makeDefault 
          position={[10, 10, 10]} 
          zoom={miniaturized ? 60 : 80} 
        />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={!miniaturized} 
          autoRotate={!miniaturized} 
          autoRotateSpeed={0.5} 
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
        />

        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        <Grid />

        <Tower role="COMMANDER" status={agentStatuses.COMMANDER} />
        <Tower role="INTEL" status={agentStatuses.INTEL} />
        <Tower role="RISK" status={agentStatuses.RISK} />
        <Tower role="EXECUTION" status={agentStatuses.EXECUTION} />

        {activeBeams.map(beam => (
          <MessageBeam key={beam.id} sender={beam.sender} receiver={beam.receiver} />
        ))}

        {bursts.map(burst => (
          <ParticleBurst key={burst.id} position={burst.pos} />
        ))}

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.8} intensity={1.2} radius={0.4} />
          <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
          <Scanline opacity={0.08} />
        </EffectComposer>
      </Canvas>
      
      {/* HUD overlays could go here if needed, but we used Html component for tower labels */}
    </div>
  );
};
