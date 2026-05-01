import EventEmitter from 'eventemitter3';
import { A2AMessage, ENSIdentity } from '@alpha402/shared';
import { ZeroGStorage } from '../storage/zeroG.js';
import { AXLTransport, AXL_PORTS, CALLBACK_PORTS } from './axl.js';

/**
 * AgentBus — dual-mode message router
 *
 * When AXL is running:  messages go through Gensyn AXL P2P nodes (encrypted mesh)
 * When AXL is offline:  messages routed in-process via EventEmitter (dev fallback)
 *
 * 0G Storage: every message is persisted to 0G for auditability and recovery.
 */
export class AgentBus extends EventEmitter {
  private history: A2AMessage[] = [];
  private zeroG: ZeroGStorage;
  private axl: AXLTransport | null = null;
  private ens: ENSIdentity;
  private agentName: string;
  private axlActive = false;

  constructor(zeroG: ZeroGStorage, agentName = 'commander') {
    super();
    this.zeroG = zeroG;
    this.agentName = agentName;
    this.ens = new ENSIdentity(process.env.SEPOLIA_RPC_URL);
  }

  /** Call after construction. Tries to connect to AXL, falls back silently. */
  async connectAXL(): Promise<void> {
    this.axl = new AXLTransport({
      axlPort:      AXL_PORTS[this.agentName],
      callbackPort: CALLBACK_PORTS[this.agentName],
      agentName:    this.agentName,
    });

    this.axlActive = await this.axl.start();

    if (this.axlActive) {
      // Route incoming AXL messages into the EventEmitter so existing handlers still work
      this.axl.onMessage((msg) => {
        this.history.push(msg);
        this.emit('message', msg);
        this.emit(msg.to,   msg);
        this.emit(msg.type, msg);
      });
      console.log(`[Bus] Using AXL P2P transport (Gensyn) ✅`);
    } else {
      console.log(`[Bus] Using in-process EventEmitter (AXL not running)`);
    }
  }

  async publish(message: A2AMessage): Promise<void> {
    const fromENS = this.ens.getAgentName(message.from);
    console.log(`[Bus] ${fromENS} → ${message.to} : ${message.type}`);

    // Persist to 0G Storage (audit trail) — async, don't wait for it to route locally
    this.zeroG.uploadJSON(message).then(cid => {
      message.zeroGCID = cid;
    }).catch(err => {
      console.warn(`[Bus] 0G persist failed:`, (err as Error).message);
    });

    this.history.push(message);

    if (this.axlActive && this.axl) {
      // Send via AXL P2P mesh — encrypted, decentralised
      await this.axl.send(message.to, message);
    }

    // Always emit locally too (so the WS server and in-process handlers fire)
    this.emit('message', message);
    this.emit(message.to,   message);
    this.emit(message.type, message);
  }

  getHistory(strategyId?: string): A2AMessage[] {
    if (strategyId) return this.history.filter((m) => m.strategyId === strategyId);
    return this.history;
  }

  isAXLActive() {
    return this.axlActive;
  }

  stop() {
    if (this.axl) this.axl.stop();
  }
}
