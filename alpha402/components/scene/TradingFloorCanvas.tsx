'use client';

/**
 * TradingFloorCanvas — CSS/SVG animated replacement.
 *
 * The original Three.js scene breaks on React 19 because
 * @react-three/fiber is built for React 18 (ReactCurrentOwner mismatch).
 *
 * This pure-CSS version reproduces the same dark-grid + glowing-node
 * aesthetic used in WalletGate without any WebGL dependency.
 */

import { useEffect, useRef } from 'react';
import { useAlphaStore } from '@/lib/store';

interface Props {
  autoRotate?: boolean;
  compact?: boolean;
}

const NODES = [
  { id: 'COMMANDER', x: 50, y: 40, color: '#1E6FFF', label: 'CMD' },
  { id: 'INTEL',     x: 25, y: 65, color: '#00F5FF', label: 'INT' },
  { id: 'RISK',      x: 75, y: 65, color: '#F59E0B', label: 'RSK' },
  { id: 'EXECUTION', x: 50, y: 85, color: '#00FF88', label: 'EXE' },
];

const LINKS = [
  ['COMMANDER', 'INTEL'],
  ['COMMANDER', 'RISK'],
  ['INTEL',     'EXECUTION'],
  ['RISK',      'EXECUTION'],
];

function getNode(id: string) {
  return NODES.find(n => n.id === id)!;
}

export default function TradingFloorCanvas({ compact = false }: Props) {
  const activeBeams = useAlphaStore(s => s.activeBeams);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const frameRef    = useRef<number>(0);
  const tickRef     = useRef(0);

  // Animated grid via Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      tickRef.current += 0.012;
      const t = tickRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#080C14';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      const GRID = compact ? 30 : 50;
      ctx.strokeStyle = 'rgba(30,111,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Inactive links
      LINKS.forEach(([aId, bId]) => {
        const a = getNode(aId); const b = getNode(bId);
        const ax = (a.x / 100) * W; const ay = (a.y / 100) * H;
        const bx = (b.x / 100) * W; const by = (b.y / 100) * H;
        ctx.strokeStyle = 'rgba(30,111,255,0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.setLineDash([]);
      });

      // Active beam pulses
      activeBeams.forEach(beam => {
        const a = NODES.find(n => n.id === beam.sender.toUpperCase());
        const b = NODES.find(n => n.id === beam.receiver.toUpperCase());
        if (!a || !b) return;
        const ax = (a.x / 100) * W; const ay = (a.y / 100) * H;
        const bx = (b.x / 100) * W; const by = (b.y / 100) * H;
        const pulse = (Math.sin(t * 6) + 1) / 2;
        const grad = ctx.createLinearGradient(ax, ay, bx, by);
        grad.addColorStop(0, `${a.color}00`);
        grad.addColorStop(0.5, `${a.color}cc`);
        grad.addColorStop(1, `${b.color}00`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + pulse * 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      });

      // Nodes
      NODES.forEach(node => {
        const x = (node.x / 100) * W;
        const y = (node.y / 100) * H;
        const r = compact ? 10 : 16;
        const pulse = (Math.sin(t * 2 + NODES.indexOf(node)) + 1) / 2;

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        glow.addColorStop(0, `${node.color}30`);
        glow.addColorStop(1, `${node.color}00`);
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();

        // Ring
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1 + pulse;
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        ctx.beginPath(); ctx.arc(x, y, r + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;

        // Core
        ctx.fillStyle = '#080C14';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

        // Label
        if (!compact) {
          ctx.fillStyle = node.color;
          ctx.font = '700 9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, x, y);
        }
      });

      // Floating particles
      for (let i = 0; i < 20; i++) {
        const px = (Math.sin(t * 0.3 + i * 2.3) * 0.5 + 0.5) * W;
        const py = (Math.cos(t * 0.2 + i * 1.7) * 0.5 + 0.5) * H;
        const alpha = (Math.sin(t + i) + 1) / 4;
        ctx.fillStyle = `rgba(0,245,255,${alpha})`;
        ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2); ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    // Resize handler
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [activeBeams, compact]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
