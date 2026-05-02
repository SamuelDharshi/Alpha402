import http from 'http';
import { WebSocketServer } from 'ws';
import { AgentBus } from '../bus/index.js';
import { A2AMessage } from '@alpha402/shared';

export function startWSServer(bus: AgentBus, commander?: any) {
  const port = parseInt(process.env.PORT || '3001');

  // HTTP server handles Render health checks + WebSocket upgrades
  const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'Alpha402 Agent Bus', agents: 4 }));
  });

  const wss = new WebSocketServer({ server: httpServer });

  // BigInt-safe serializer for WebSockets
  const safeStringify = (obj: any) => JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value
  );

  wss.on('connection', (ws) => {
    console.log('[WS] Dashboard connected');

    // Send last 100 messages on connect so dashboard shows history
    const history = bus.getHistory().slice(-100);
    ws.send(safeStringify({ type: 'HISTORY', data: history }));

    // Forward all new agent messages to the dashboard
    const listener = (msg: A2AMessage) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(safeStringify({ type: 'A2A_MESSAGE', data: msg }));
      }
    };
    bus.on('message', listener);

    // Accept inbound commands from dashboard
    ws.on('message', async (raw) => {
      try {
        const data = raw.toString();
        console.log(`[WS] Inbound: ${data}`);
        const cmd = JSON.parse(data);

        if (cmd.type === 'PARSE_STRATEGY' && commander) {
          console.log(`[WS] Received strategy from dashboard: "${cmd.input}"`);
          await commander.parseStrategy(cmd.input, cmd.owner ?? 'dashboard_user');
        }

        if (cmd.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
        }
      } catch (err) {
        console.error('[WS] Bad message from dashboard:', err);
      }
    });

    ws.on('close', () => {
      bus.off('message', listener);
      console.log('[WS] Dashboard disconnected');
    });

    ws.on('error', (err) => console.error('[WS] Socket error:', err));
  });

  httpServer.listen(port, () => {
    console.log(`[WS] Server running on port ${port}`);
  });

  return wss;
}
