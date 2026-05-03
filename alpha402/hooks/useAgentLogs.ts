"use client";

import { useEffect, useRef, useState } from "react";

export interface AgentLog {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  type: string;
  strategyId?: string;
  payload: any;
}

export interface AgentStatus {
  commander: boolean;
  intel: boolean;
  risk: boolean;
  execution: boolean;
}

export interface UseAgentLogsResult {
  logs: AgentLog[];
  status: AgentStatus;
  connected: boolean;
  lastTxHash: string | null;
  lastStrategy: any | null;
  terminalLines: string[];
}

const WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL ?? "ws://localhost:3001";

const TYPE_LABELS: Record<string, string> = {
  STRATEGY_PARSED:    "[COMMANDER] Strategy parsed and registered on-chain",
  INTEL_WATCHING:     "[INTEL]     Watching price feeds...",
  TRIGGER_FIRED:      "[INTEL]     🔔 Trigger fired — price condition met",
  RISK_SCORING:       "[RISK]      Scoring trade with 0G Compute (TEE)...",
  RISK_APPROVED:      "[RISK]      ✅ Trade APPROVED",
  RISK_REJECTED:      "[RISK]      ❌ Trade REJECTED",
  EXECUTION_SUBMITTED:"[EXEC]      Submitting via KeeperHub...",
  EXECUTION_CONFIRMED:"[EXEC]      ✅ Trade CONFIRMED on Sepolia",
  EXECUTION_FAILED:   "[EXEC]      ❌ Execution failed",
};

export function useAgentLogs(): UseAgentLogsResult {
  const [logs, setLogs]               = useState<AgentLog[]>([]);
  const [connected, setConnected]     = useState(false);
  const [lastTxHash, setLastTxHash]   = useState<string | null>(null);
  const [lastStrategy, setLastStrategy] = useState<any | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "[SYSTEM]    Alpha402 multi-agent crew initializing...",
    "[0G]        Compute network connected (TEE-verified)",
    "[STORAGE]   0G storage indexer ready",
    "[AXL]       Gensyn P2P mesh: fallback EventEmitter active",
    "[KEEPER]    KeeperHub execution layer ready",
    "[SYSTEM]    Waiting for strategy intent...",
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<AgentStatus>({
    commander: false,
    intel: false,
    risk: false,
    execution: false,
  });

  useEffect(() => {
    function connect() {
      if (typeof window === "undefined") return;
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setStatus({ commander: true, intel: true, risk: true, execution: true });
          addTerminalLine("[SYSTEM]    ✅ Connected to Alpha402 agent WebSocket");
        };

        ws.onmessage = (event) => {
          try {
            const envelope = JSON.parse(event.data);
            if (envelope.type === "HISTORY") {
              // Replay history on connect
              const history: AgentLog[] = (envelope.data ?? []).map((m: any) => m.data ?? m).filter(Boolean);
              setLogs(history.slice(-50));
              history.forEach(processMessage);
              return;
            }
            const msg: AgentLog = envelope.data ?? envelope;
            if (!msg?.type) return;
            setLogs((prev) => [...prev.slice(-49), msg]);
            processMessage(msg);
          } catch {}
        };

        ws.onclose = () => {
          setConnected(false);
          setStatus({ commander: false, intel: false, risk: false, execution: false });
          addTerminalLine("[SYSTEM]    ⚠️  Disconnected — retrying in 5s...");
          reconnectRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          addTerminalLine("[SYSTEM]    ❌ WebSocket error (agents offline?)");
        };
      } catch {}
    }

    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  function processMessage(msg: AgentLog) {
    const label = TYPE_LABELS[msg.type];
    if (!label) return;

    let extra = "";
    if (msg.type === "TRIGGER_FIRED") {
      extra = ` ETH @ $${msg.payload?.currentValue?.toFixed(2)} < $${msg.payload?.threshold}`;
    }
    if (msg.type === "RISK_APPROVED") {
      extra = ` Score: ${msg.payload?.score}/10`;
    }
    if (msg.type === "EXECUTION_CONFIRMED") {
      const tx = msg.payload?.txHash;
      if (tx && tx.startsWith("0x")) {
        setLastTxHash(tx);
        extra = ` Tx: ${tx.slice(0, 18)}...`;
      }
    }
    if (msg.type === "STRATEGY_PARSED" && msg.payload?.strategy) {
      setLastStrategy(msg.payload.strategy);
    }

    addTerminalLine(label + extra);
  }

  function addTerminalLine(line: string) {
    setTerminalLines((prev) => [...prev.slice(-19), line]);
  }

  return { logs, status, connected, lastTxHash, lastStrategy, terminalLines };
}
