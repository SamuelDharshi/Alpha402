/**
 * AXL Transport — Gensyn Agent eXchange Layer
 *
 * AXL is a P2P message-routing daemon. In production, one AXL binary runs on
 * localhost:9002 and acts as a mesh relay for all agents on this machine.
 *
 * Binary download: https://github.com/gensyn-ai/axl/releases
 * Start command:   axl --port 9002
 *
 * Message protocol:
 *   POST http://localhost:9002/send
 *   Body: { to: "agent-name", payload: <A2AMessage> }
 *
 * Incoming messages:
 *   AXL delivers to our callback server via POST to the registered URL.
 *   We register on startup: POST /register { agent, callbackUrl }
 *
 * Fallback: if AXL is not running, AgentBus uses in-process EventEmitter.
 * The system is fully functional in either mode — AXL just adds real P2P routing.
 */

import http from 'http';
import { A2AMessage } from '../shared.js';

export interface AXLConfig {
  /** Agent name (commander | intel | risk | execution) */
  agentName: string;
  /** Port our callback HTTP server will listen on (AXL POST messages here) */
  callbackPort: number;
}

/** Real AXL binary listens on this single port (all agents share it) */
const AXL_PORT = parseInt(process.env.AXL_PORT ?? '9002');

/** Base URL for the AXL HTTP API */
const AXL_BASE = `http://localhost:${AXL_PORT}`;

export class AXLTransport {
  private agentName:       string;
  private callbackPort:    number;
  private messageHandlers: Array<(msg: A2AMessage) => void> = [];
  private available        = false;
  private server:          http.Server | null = null;

  constructor(config: AXLConfig) {
    this.agentName    = config.agentName;
    this.callbackPort = config.callbackPort;
  }

  /**
   * Start the AXL transport.
   * Returns true if AXL is running; false → caller uses EventEmitter fallback.
   */
  async start(): Promise<boolean> {
    this.available = await this.pingAXL();

    if (!this.available) {
      console.warn(
        `[AXL:${this.agentName}] AXL daemon not found on port ${AXL_PORT}. Falling back to in-process bus.\n` +
        `  To enable AXL P2P mesh:\n` +
        `    1. Download binary: https://github.com/gensyn-ai/axl/releases\n` +
        `    2. Run: axl --port ${AXL_PORT}\n` +
        `    3. Restart agents`
      );
      return false;
    }

    // Start our callback server so AXL can deliver messages to this agent
    await this.startCallbackServer();

    // Register this agent's callback URL with the AXL daemon
    await this.registerWithAXL();

    console.log(
      `[AXL:${this.agentName}] ✅ Connected to AXL daemon on :${AXL_PORT} ` +
      `| Callback: :${this.callbackPort}`
    );
    return true;
  }

  /** Send a message to another agent via AXL */
  async send(to: string, message: A2AMessage): Promise<void> {
    if (!this.available) return; // handled by EventEmitter fallback

    try {
      const res = await fetch(`${AXL_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,       // target agent name — AXL looks up its registered callback
          payload:  message,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[AXL:${this.agentName}] Send to '${to}' failed: ${res.status} ${body}`);
      }
    } catch (err) {
      // Don't crash — bus will retry via EventEmitter
      console.warn(`[AXL:${this.agentName}] Send error (AXL unreachable):`, (err as Error).message);
      this.available = false;
    }
  }

  onMessage(handler: (msg: A2AMessage) => void) {
    this.messageHandlers.push(handler);
  }

  isAvailable() {
    return this.available;
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.available = false;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async pingAXL(): Promise<boolean> {
    try {
      const res = await fetch(`${AXL_BASE}/status`, {
        signal: AbortSignal.timeout(800),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** HTTP server that receives messages delivered by AXL */
  private startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (req.method === 'POST' && (req.url === '/' || req.url === '/axl')) {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const msg = JSON.parse(body) as A2AMessage;
              console.log(`[AXL:${this.agentName}] ← ${msg.type} from ${msg.from}`);
              this.messageHandlers.forEach((h) => h(msg));
            } catch (e) {
              console.error(`[AXL:${this.agentName}] Bad message:`, e);
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[AXL:${this.agentName}] Callback port ${this.callbackPort} in use — skipping`);
          resolve(); // Non-fatal: AXL can still send, but won't deliver here
        } else {
          reject(err);
        }
      });

      this.server.listen(this.callbackPort, () => resolve());
    });
  }

  /** Tell the AXL daemon where to deliver messages for this agent */
  private async registerWithAXL(): Promise<void> {
    try {
      const callbackUrl = `http://localhost:${this.callbackPort}/axl`;
      const res = await fetch(`${AXL_BASE}/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agent: this.agentName, callbackUrl }),
      });
      if (!res.ok) {
        console.warn(`[AXL:${this.agentName}] Registration returned ${res.status} — continuing`);
      }
    } catch {
      // Non-fatal: AXL may route by convention without registration
    }
  }
}
