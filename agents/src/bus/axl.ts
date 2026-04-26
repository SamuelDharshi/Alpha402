/**
 * AXL Transport — Gensyn Agent eXchange Layer
 * 
 * AXL is a P2P daemon. Each agent runs its own AXL node on a different port.
 * Agents communicate via HTTP to their local AXL node; AXL routes across the mesh.
 * 
 * Architecture:
 *   Commander  (AXL :8765) ←P2P mesh→ Intel (AXL :8766)
 *              ↕                              ↕
 *   Execution  (AXL :8768) ←P2P mesh→ Risk  (AXL :8767)
 * 
 * AXL download: https://github.com/gensyn-ai/axl/releases
 */

import http from 'http';
import { A2AMessage } from '@alpha402/shared';

export interface AXLConfig {
  /** Port this agent's AXL node listens on */
  axlPort: number;
  /** Port our callback HTTP server listens on (AXL posts received messages here) */
  callbackPort: number;
  /** Agent name (commander | intel | risk | execution) */
  agentName: string;
}

/** Known AXL node ports for each agent */
export const AXL_PORTS: Record<string, number> = {
  commander: parseInt(process.env.AXL_PORT_COMMANDER ?? '8765'),
  intel:     parseInt(process.env.AXL_PORT_INTEL     ?? '8766'),
  risk:      parseInt(process.env.AXL_PORT_RISK       ?? '8767'),
  execution: parseInt(process.env.AXL_PORT_EXECUTION  ?? '8768'),
};

/** Callback ports our HTTP servers listen on (AXL delivers messages here) */
export const CALLBACK_PORTS: Record<string, number> = {
  commander: parseInt(process.env.CB_PORT_COMMANDER ?? '9765'),
  intel:     parseInt(process.env.CB_PORT_INTEL     ?? '9766'),
  risk:      parseInt(process.env.CB_PORT_RISK       ?? '9767'),
  execution: parseInt(process.env.CB_PORT_EXECUTION  ?? '9768'),
};

export class AXLTransport {
  private axlPort: number;
  private callbackPort: number;
  private agentName: string;
  private messageHandlers: Array<(msg: A2AMessage) => void> = [];
  private available = false;

  constructor(config: AXLConfig) {
    this.axlPort  = config.axlPort;
    this.callbackPort = config.callbackPort;
    this.agentName = config.agentName;
  }

  /** Start the callback HTTP server so AXL can deliver messages to us */
  async start(): Promise<boolean> {
    // 1. Check if AXL is running
    this.available = await this.pingAXL();

    if (!this.available) {
      console.warn(
        `[AXL:${this.agentName}] AXL node not found on port ${this.axlPort}. ` +
        `Falling back to in-process bus.\n` +
        `  To enable AXL: download from https://github.com/gensyn-ai/axl/releases\n` +
        `  Then run: axl --port ${this.axlPort} --callback http://localhost:${this.callbackPort}/axl`
      );
      return false;
    }

    // 2. Start our HTTP callback server
    await this.startCallbackServer();

    // 3. Register our callback URL with AXL
    await this.registerCallback();

    console.log(`[AXL:${this.agentName}] ✅ Connected. Node :${this.axlPort} → Callback :${this.callbackPort}`);
    return true;
  }

  // BigInt-safe serializer for AXL
  private safeStringify(obj: any) {
    return JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    );
  }

  /** Send a message to another agent via AXL */
  async send(to: string, message: A2AMessage): Promise<void> {
    if (!this.available) return; // handled by fallback EventEmitter

    const targetPort = AXL_PORTS[to];
    if (!targetPort) {
      console.warn(`[AXL] Unknown agent: ${to}`);
      return;
    }

    try {
      const res = await fetch(`http://localhost:${this.axlPort}/api/v1/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: this.safeStringify({
          recipient: `axl://localhost:${targetPort}`,
          payload: message,
          encrypted: true,
        }),
      });

      if (!res.ok) {
        console.error(`[AXL] Send failed: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.error('[AXL] Send error:', err);
    }
  }

  onMessage(handler: (msg: A2AMessage) => void) {
    this.messageHandlers.push(handler);
  }

  isAvailable() {
    return this.available;
  }

  private async pingAXL(): Promise<boolean> {
    try {
      const res = await fetch(`http://localhost:${this.axlPort}/api/v1/status`, {
        signal: AbortSignal.timeout(1000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private startCallbackServer(): Promise<void> {
    return new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        if (req.url === '/axl' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const msg = JSON.parse(body) as A2AMessage;
              console.log(`[AXL:${this.agentName}] ← received ${msg.type} from ${msg.from}`);
              this.messageHandlers.forEach((h) => h(msg));
            } catch (e) {
              console.error('[AXL] Bad message:', e);
            }
            res.writeHead(200);
            res.end('OK');
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.listen(this.callbackPort, () => resolve());
    });
  }

  private async registerCallback(): Promise<void> {
    try {
      await fetch(`http://localhost:${this.axlPort}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: this.safeStringify({
          agent: this.agentName,
          callbackUrl: `http://localhost:${this.callbackPort}/axl`,
        }),
      });
    } catch {
      // Non-fatal — AXL may auto-discover
    }
  }
}
