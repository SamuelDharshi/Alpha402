"use client";
import { useState, useEffect } from "react";
import { useAlphaStore } from "@/lib/store";

// Space Grotesk as font family string for SVG
const SG = "var(--font-space), 'Space Grotesk', system-ui, sans-serif";

// ── Colors ────────────────────────────────────────────────────────────────────
const COL = {
  cmd:   "#3B82F6",   // blue
  intel: "#22D3EE",   // cyan
  risk:  "#F59E0B",   // amber
  exec:  "#10B981",   // emerald
  cons:  "#A78BFA",   // purple
  bg:    "#0F1117",
  card:  "#161B27",
  border:"rgba(255,255,255,0.08)",
  dim:   "rgba(255,255,255,0.06)",
  text:  "rgba(255,255,255,0.85)",
  muted: "rgba(255,255,255,0.35)",
};

// ── Bezier helper ─────────────────────────────────────────────────────────────
function bezPt(t: number, x1: number, y1: number, cx: number, cy: number, cx2: number, cy2: number, x2: number, y2: number) {
  const m = 1 - t;
  return {
    x: m*m*m*x1 + 3*m*m*t*cx + 3*m*t*t*cx2 + t*t*t*x2,
    y: m*m*m*y1 + 3*m*m*t*cy + 3*m*t*t*cy2 + t*t*t*y2,
  };
}

type BZ = [number,number,number,number,number,number,number,number];

// ── Connector line ────────────────────────────────────────────────────────────
function Wire({ d, active, done, color, bz, tick }: {
  d: string; active?: boolean; done?: boolean;
  color: string; bz: BZ; tick: number;
}) {
  const t = ((tick * 1.2) % 100) / 100;
  const pt = active ? bezPt(t, ...bz) : null;
  return (
    <g>
      {/* static dim wire */}
      <path d={d} fill="none" stroke={COL.dim} strokeWidth="1.5" />
      {/* done — solid colored wire */}
      {done && <path d={d} fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />}
      {/* active — animated dash + dot */}
      {active && <>
        <path d={d} fill="none" stroke={color} strokeWidth="1.5"
          strokeDasharray="6 10"
          strokeDashoffset={-(tick * 1.2 % 16)}
          opacity="0.8" />
        {pt && <circle cx={pt.x} cy={pt.y} r="3.5" fill={color} opacity="0.9" />}
      </>}
    </g>
  );
}

// Junction dot (small circle at connection points between wire and card)
function Dot({ x, y, color, active }: { x: number; y: number; color: string; active?: boolean }) {
  return (
    <circle cx={x} cy={y} r="4" fill={active ? color : "#1E2537"}
      stroke={active ? color : "rgba(255,255,255,0.15)"} strokeWidth="1.5" />
  );
}

// ── Node card ─────────────────────────────────────────────────────────────────
function NodeCard({ x, y, w = 170, h = 80, role, name, color, state, detail, score }: {
  x: number; y: number; w?: number; h?: number;
  role: string; name: string; color: string;
  state: "idle" | "active" | "done";
  detail?: string; score?: string;
}) {
  const done   = state === "done";
  const active = state === "active";

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      {/* outer glow when active/done */}
      {(active || done) && (
        <rect x="-4" y="-4" width={w + 8} height={h + 8} rx="14"
          fill={color} opacity={done ? 0.06 : 0.04} />
      )}

      {/* card body */}
      <rect width={w} height={h} rx="10"
        fill={COL.card}
        stroke={done ? color : active ? color + "88" : COL.border}
        strokeWidth={done ? 1.5 : 1}
      />

      {/* role label (small caps top-left) */}
      <text x="12" y="18" fill={COL.muted} fontSize="8"
        fontFamily={SG} fontWeight="500" letterSpacing="1.5">
        {role.toUpperCase()}
      </text>

      {/* status dot */}
      <circle cx={w - 16} cy="14" r="4"
        fill={done ? color : active ? color : "rgba(255,255,255,0.12)"}
        stroke="none">
        {active && <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />}
        {done   && <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />}
      </circle>

      {/* main name */}
      <text x="12" y="36" fill={done ? COL.text : active ? COL.text : "rgba(255,255,255,0.5)"}
        fontSize="13" fontFamily={SG} fontWeight="700">
        {name}
      </text>

      {/* detail line 1 */}
      {detail && (
        <text x="12" y="50" fill={done ? color : COL.muted}
          fontSize="9" fontFamily={SG} fontWeight={done ? "600" : "400"}>
          {detail.slice(0, 35)}{detail.length > 35 ? "…" : ""}
        </text>
      )}

      {/* score / secondary detail */}
      {score && (
        <text x="12" y="66" fill={COL.muted} fontSize="8.5" fontFamily={SG} fontWeight="400">
          {score.slice(0, 30)}
        </text>
      )}

      {/* idle state placeholder */}
      {!detail && state !== "active" && (
        <text x="12" y="52" fill="rgba(255,255,255,0.18)" fontSize="9" fontFamily={SG} fontStyle="italic">
          waiting
        </text>
      )}
      {!detail && state === "active" && (
        <text x="12" y="52" fill={color} fontSize="9" fontFamily={SG}>
          processing…
        </text>
      )}
    </g>
  );
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
export function PipelineGraph() {
  const messages    = useAlphaStore(s => s.messages);
  const activeBeams = useAlphaStore(s => s.activeBeams);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 40);
    return () => clearInterval(id);
  }, []);

  const last = (types: string[]) =>
    [...messages].reverse().find(m => types.includes(m.type));

  const stratMsg = last(["STRATEGY_PARSED", "COMMANDER_RECEIVED"]);
  const intelMsg = last(["INTEL_WATCHING", "TRIGGER_FIRED", "PRICE_CHECK"]);
  const riskMsg  = last(["RISK_APPROVED", "RISK_REJECTED", "RISK_SCORING"]);
  const execMsg  = last(["EXECUTION_CONFIRMED", "EXECUTION_SUBMITTED", "EXECUTION_FAILED"]);

  const sp = (stratMsg?.payload as any);
  const rp = (riskMsg?.payload as any);
  const ip = (intelMsg?.payload as any);
  const ep = (execMsg?.payload as any);

  const beam = (s: string, r: string) =>
    activeBeams.some(b =>
      (b.sender?.toUpperCase() === s && b.receiver?.toUpperCase() === r) ||
      (b.sender?.toUpperCase() === r && b.receiver?.toUpperCase() === s)
    );

  const bCI = beam("COMMANDER", "INTEL");
  const bCR = beam("COMMANDER", "RISK");
  const bIC = beam("INTEL", "EXECUTION") || beam("INTEL", "COMMANDER");
  const bRC = beam("RISK", "EXECUTION")  || beam("RISK", "COMMANDER");
  const bEx = execMsg?.type === "EXECUTION_SUBMITTED" || execMsg?.type === "EXECUTION_CONFIRMED";

  const now = Date.now();
  const lastStrat = last(["STRATEGY_PARSED", "COMMANDER_RECEIVED"]);
  const lastTerm  = last(["EXECUTION_CONFIRMED", "EXECUTION_FAILED", "RISK_REJECTED"]);
  
  const stratTime = Number(lastStrat?.timestamp || 0);
  const termTime  = Number(lastTerm?.timestamp || 0);

  // A pipeline is "active" if a new strategy started after the last termination
  // OR if the termination happened very recently (within 10s).
  const isRecentlyTerminated = lastTerm && (now - termTime < 10000);
  const isActiveSession = (stratTime > 0 && stratTime > termTime) || isRecentlyTerminated;

  // For visual states, use the current messages
  const riskOk   = isActiveSession && (riskMsg?.type === "RISK_APPROVED" || (execTime >= stratTime && !!execMsg));
  const riskDone = isActiveSession && (riskMsg?.type === "RISK_APPROVED" || riskMsg?.type === "RISK_REJECTED" || (execTime >= stratTime && !!execMsg));
  const execDone = isActiveSession && execMsg?.type === "EXECUTION_CONFIRMED";
  const cmdDone  = isActiveSession && !!lastStrat;
  const intelDone= isActiveSession && (intelMsg?.type === "TRIGGER_FIRED" || (execTime >= stratTime && !!execMsg));

  // Active status overrides for glowing while "in-progress"
  const intelActive = isActiveSession && (intelMsg?.type === "INTEL_WATCHING" || intelMsg?.type === "PRICE_CHECK" || bCI) && !intelDone;
  const riskActive  = isActiveSession && (riskMsg?.type === "RISK_SCORING" || bCR) && !riskDone;
  const execActive  = isActiveSession && (execMsg?.type === "EXECUTION_SUBMITTED" || bEx) && !execDone;
  const consActive  = isActiveSession && ((riskDone && !execDone) || bIC || bRC);

  const st = (done: boolean, active: boolean): "idle" | "active" | "done" =>
    done ? "done" : active ? "active" : "idle";

  // ── Layout (SVG 480 × 570) ────────────────────────────────────────────────
  // USER  (240, 44)
  // CMD   (240, 136)
  // INTEL (110, 272)   RISK (370, 272)
  // CONS  (240, 400)
  // EXEC  (240, 498)

  return (
    <svg viewBox="0 0 480 570" className="w-full h-full" style={{ overflow: "visible" }}>

      {/* ── Wires ── */}

      {/* USER → CMD */}
      <Wire d="M240,68 L240,96" active={isActiveSession && cmdDone && !bCI && !bCR} done={cmdDone}
        color={COL.cmd} bz={[240,68,240,75,240,88,240,96]} tick={tick} />

      {/* CMD → INTEL */}
      <Wire d="M176,155 C160,175 130,210 110,232"
        active={isActiveSession && bCI} done={cmdDone}
        color={COL.intel} bz={[176,155,160,175,130,210,110,232]} tick={tick} />

      {/* CMD → RISK */}
      <Wire d="M304,155 C320,175 350,210 370,232"
        active={isActiveSession && bCR} done={cmdDone}
        color={COL.risk} bz={[304,155,320,175,350,210,370,232]} tick={tick} />

      {/* INTEL → CONS */}
      <Wire d="M110,312 C110,345 180,370 220,380"
        active={isActiveSession && bIC} done={intelDone}
        color={COL.intel} bz={[110,312,110,345,180,370,220,380]} tick={tick} />

      {/* RISK → CONS */}
      <Wire d="M370,312 C370,345 300,370 260,380"
        active={isActiveSession && bRC} done={riskDone}
        color={riskOk ? COL.exec : COL.risk} bz={[370,312,370,345,300,370,260,380]} tick={tick} />

      {/* CONS → EXEC */}
      <Wire d="M240,420 L240,458" active={isActiveSession && bEx} done={riskDone && riskOk}
        color={COL.exec} bz={[240,420,240,432,240,446,240,458]} tick={tick} />

      {/* ── Junction dots ── */}
      <Dot x={240} y={68}  color={COL.cmd}   active={cmdDone} />
      <Dot x={240} y={96}  color={COL.cmd}   active={cmdDone} />
      <Dot x={110} y={232} color={COL.intel} active={cmdDone} />
      <Dot x={110} y={312} color={COL.intel} active={intelDone} />
      <Dot x={370} y={232} color={COL.risk}  active={cmdDone} />
      <Dot x={370} y={312} color={COL.risk}  active={riskDone} />
      <Dot x={240} y={380} color={riskOk ? COL.exec : COL.cons} active={riskDone} />
      <Dot x={240} y={420} color={riskOk ? COL.exec : COL.cons} active={riskDone} />
      <Dot x={240} y={458} color={COL.exec}  active={riskDone && riskOk} />

      {/* ── Nodes ── */}

      {/* USER INTENT */}
      <NodeCard x={240} y={44} w={200} h={74}
        role="input" name="User Intent"
        color={COL.cmd}
        state={cmdDone ? "done" : "idle"}
        detail={sp?.input ?? sp?.action ?? undefined}
      />

      {/* COMMANDER */}
      <NodeCard x={240} y={126} w={190} h={74}
        role="commander" name="Commander"
        color={COL.cmd}
        state={st(cmdDone, bCI || bCR)}
        detail={cmdDone ? (sp?.action ?? "BUY ETH") : undefined}
        score={cmdDone ? "Strategy parsed ✓" : undefined}
      />

      {/* INTEL */}
      <NodeCard x={110} y={272} w={185} h={86}
        role="intel" name="Intel Agent"
        color={COL.intel}
        state={st(intelDone, intelActive)}
        detail={intelDone ? "🔔 Trigger fired" : intelMsg ? "👁 Watching feeds" : undefined}
        score={ip?.price ? `Price: $${ip.price}` : "[x402] paid price feed"}
      />

      {/* RISK */}
      <NodeCard x={370} y={272} w={185} h={86}
        role="risk · 0g tee" name="Risk Agent"
        color={COL.risk}
        state={st(riskDone, riskActive)}
        detail={riskOk ? "✅ Approved" : riskDone ? "❌ Rejected" : riskMsg ? "Scoring…" : undefined}
        score={rp?.score ? `Score: ${rp.score}/10 · ${rp.reasoning?.slice(0, 18)}…` : undefined}
      />

      {/* CONSENSUS */}
      <NodeCard x={240} y={400} w={200} h={66}
        role="consensus" name={riskDone ? (riskOk ? "YES — Execute" : "NO — Rejected") : "Consensus"}
        color={riskOk ? COL.exec : COL.cons}
        state={st(riskDone, consActive)}
        detail={riskDone ? (riskOk ? "Forwarding to execution" : "Strategy rejected") : undefined}
      />

      {/* EXECUTION */}
      <NodeCard x={240} y={498} w={220} h={80}
        role="execution · keeperhub" name="Execution"
        color={COL.exec}
        state={st(execDone, execActive)}
        detail={execDone ? "✅ Trade confirmed" : execMsg?.type === "EXECUTION_SUBMITTED" ? "Submitting tx…" : undefined}
        score={ep?.txHash ? `Tx: ${ep.txHash.slice(0, 24)}…` : execDone ? "Via KeeperHub · Sepolia" : undefined}
      />
    </svg>
  );
}
