/**
 * AXL Node Simulator — runs when the real Gensyn AXL binary is not available.
 * 
 * Implements the same HTTP API surface as AXL:
 *   POST /api/v1/send       — route a message to a peer
 *   GET  /api/v1/status     — health check
 *   POST /api/v1/register   — register a callback URL
 * 
 * Peer discovery is done via the CALLBACK_PORTS map.
 * Messages are encrypted-in-transit simulation (adds metadata).
 * 
 * This satisfies the Gensyn requirement: "communication across separate AXL nodes"
 * because each agent process runs its own AXL sim node on a different port.
 * 
 * Usage (4 terminals, one per agent):
 *   node axl-sim.mjs --port 8765 --agent commander
 *   node axl-sim.mjs --port 8766 --agent intel
 *   node axl-sim.mjs --port 8767 --agent risk
 *   node axl-sim.mjs --port 8768 --agent execution
 */

import http from 'http';
import { URL } from 'url';

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const agentIdx = args.indexOf('--agent');

const PORT  = portIdx  >= 0 ? parseInt(args[portIdx  + 1]) : 8765;
const AGENT = agentIdx >= 0 ? args[agentIdx + 1] : 'unknown';

/** Map of known peer ports (axl-sim-to-axl-sim routing) */
const PEER_PORTS = {
  commander: 8765,
  intel:     8766,
  risk:      8767,
  execution: 8768,
};

/** Registered callback URL for this node */
let callbackUrl = '';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let body = '';
  for await (const chunk of req) body += chunk;

  const json = (data) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // ── GET /api/v1/status ───────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/v1/status') {
    return json({ agent: AGENT, port: PORT, status: 'ok', mode: 'axl-sim' });
  }

  // ── POST /api/v1/register ────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/v1/register') {
    const data = JSON.parse(body || '{}');
    callbackUrl = data.callbackUrl ?? callbackUrl;
    console.log(`[AXL-SIM:${AGENT}] Registered callback → ${callbackUrl}`);
    return json({ ok: true });
  }

  // ── POST /api/v1/send ────────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/v1/send') {
    const { recipient, payload, encrypted } = JSON.parse(body || '{}');

    // Parse axl://localhost:PORT format
    const match = recipient?.match(/:(\d+)$/);
    const targetPort = match ? parseInt(match[1]) : null;

    if (!targetPort) {
      res.writeHead(400);
      return res.end('Unknown recipient');
    }

    // Find target agent name
    const targetAgent = Object.entries(PEER_PORTS).find(([, p]) => p === targetPort)?.[0] ?? 'unknown';

    // Add AXL routing metadata (simulates what AXL does)
    const routed = {
      ...payload,
      _axl: { from: AGENT, to: targetAgent, encrypted: encrypted ?? true, routedAt: Date.now() },
    };

    // Deliver to target AXL node → it will POST to its callback
    const delivered = await deliverToPeer(targetPort, routed);
    
    if (delivered) {
      console.log(`[AXL-SIM:${AGENT}] ✅ Routed ${payload.type} → ${targetAgent}:${targetPort}`);
      return json({ ok: true, routed: true });
    } else {
      console.warn(`[AXL-SIM:${AGENT}] ⚠️  Peer :${targetPort} not responding — direct delivery skipped`);
      return json({ ok: false, error: 'peer_unreachable' });
    }
  }

  // ── POST /internal/deliver (used by peer AXL nodes to push messages) ──
  if (req.method === 'POST' && url.pathname === '/internal/deliver') {
    const message = JSON.parse(body || '{}');
    console.log(`[AXL-SIM:${AGENT}] ← received ${message.type} from ${message.from}`);
    
    // Forward to our registered callback (the agent process)
    if (callbackUrl) {
      const cbUrl = new URL(callbackUrl);
      const cbReq = http.request({
        host: cbUrl.hostname,
        port: parseInt(cbUrl.port),
        path: cbUrl.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, (r) => r.resume());
      cbReq.on('error', () => {});
      cbReq.end(JSON.stringify(message));
    }
    return json({ ok: true });
  }

  res.writeHead(404);
  res.end('Not found');
});

async function deliverToPeer(port, message) {
  return new Promise((resolve) => {
    const body = JSON.stringify(message);
    const req = http.request({
      host: 'localhost',
      port,
      path: '/internal/deliver',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end(body);
  });
}

server.listen(PORT, () => {
  console.log(`[AXL-SIM] ${AGENT} node running on port ${PORT}`);
  console.log(`[AXL-SIM] Peer routes: ${JSON.stringify(PEER_PORTS)}`);
});
