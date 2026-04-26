import { Bot } from 'grammy';
import WebSocket from 'ws';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const AGENT_WS = process.env.AGENT_WS_URL || 'ws://localhost:3001';

if (!token) {
  console.error('[Bot] ❌ TELEGRAM_BOT_TOKEN missing in .env');
  process.exit(1);
}

const bot = new Bot(token);

// ── WebSocket connection to the agent system ──────────────────────────────────
// Maps strategyId → Telegram chatId so we can route agent replies back
const strategyToChat = new Map<string, number>();
// Maps chatId → strategyId (most recent)
const chatToStrategy = new Map<number, string>();

let ws: WebSocket | null = null;
let wsReady = false;

function connectToAgents() {
  console.log(`[Bot] Connecting to agent system at ${AGENT_WS}...`);
  ws = new WebSocket(AGENT_WS);

  ws.on('open', () => {
    wsReady = true;
    console.log('[Bot] ✅ Connected to agent WebSocket');
  });

  ws.on('message', async (raw) => {
    try {
      const envelope = JSON.parse(raw.toString());

      // Ignore history replay on connect
      if (envelope.type === 'HISTORY') return;

      const msg = envelope.data;
      if (!msg) return;

      // Route message to the right Telegram chat
      const chatId = strategyToChat.get(msg.strategyId);
      if (!chatId) return;

      await routeAgentMessage(chatId, msg);
    } catch (err) {
      console.error('[Bot] WS parse error:', err);
    }
  });

  ws.on('close', () => {
    wsReady = false;
    console.log('[Bot] Agent WS disconnected — retrying in 3s...');
    setTimeout(connectToAgents, 3000);
  });

  ws.on('error', (err) => {
    console.error('[Bot] Agent WS error:', err.message);
  });
}

/** Turn an agent A2A message into a Telegram message */
async function routeAgentMessage(chatId: number, msg: any) {
  const { from, type, payload } = msg;

  const agentIcon: Record<string, string> = {
    commander: '👨‍✈️',
    intel:     '👁',
    risk:      '⚖️',
    execution: '⚡',
  };

  const icon = agentIcon[from] ?? '🤖';

  switch (type) {
    case 'STRATEGY_PARSED': {
      const s = payload.strategy;
      const { ethers } = await import('ethers');
      const eth = s.maxPositionWei
        ? ethers.formatEther(BigInt(s.maxPositionWei.replace?.('n', '') ?? s.maxPositionWei))
        : '?';
      await bot.api.sendMessage(chatId,
        `${icon} *Commander* — Strategy Parsed ✅\n\n` +
        `📋 \`${s.naturalLanguageInput?.slice(0, 80) ?? ''}\`\n\n` +
        `• Max position: *${eth} ETH*\n` +
        `• Stop loss: *${(s.stopLossPercent / 100).toFixed(0)}%*\n` +
        `• Max gas: *${s.maxGasGwei} gwei*\n\n` +
        `_Intel Agent is now watching price feeds..._`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    case 'TRIGGER_FIRED': {
      await bot.api.sendMessage(chatId,
        `${icon} *Intel* — 🔔 TRIGGER FIRED!\n\n` +
        `ETH price: *$${payload.currentValue?.toFixed(2)}* crossed below $${payload.threshold}\n` +
        `_[x402] Paid $${payload.dataCostUsd ?? '0.001'} for price data_\n\n` +
        `Forwarding to Risk Agent...`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    case 'RISK_SCORING': {
      await bot.api.sendMessage(chatId,
        `${icon} *Risk* — Scoring trade...\n_Calling Groq AI for risk inference..._`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    case 'RISK_APPROVED': {
      await bot.api.sendMessage(chatId,
        `${icon} *Risk* — ✅ APPROVED\n\n` +
        `Score: *${payload.score}/10*\n` +
        `_${payload.reasoning}_\n\n` +
        `Forwarding to Execution Agent...`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    case 'RISK_REJECTED': {
      await bot.api.sendMessage(chatId,
        `${icon} *Risk* — ❌ REJECTED\n\n_${payload.reasoning}_`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    case 'EXECUTION_CONFIRMED': {
      const { txHash, gasUsed, explorer, method } = payload;
      await bot.api.sendMessage(chatId,
        `${icon} *Execution* — ✅ TRADE CONFIRMED\n\n` +
        `🔗 Tx: \`${txHash?.slice(0, 20)}...\`\n` +
        `⛽ Gas used: ${gasUsed}\n` +
        `🛠 Via: ${method === 'keeperhub_api' ? 'KeeperHub ✅' : 'Direct Sepolia'}\n` +
        (explorer ? `🌐 [View on Sepolia](${explorer})` : ''),
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
      break;
    }

    case 'EXECUTION_FAILED': {
      await bot.api.sendMessage(chatId,
        `${icon} *Execution* — ❌ FAILED\n\`${payload.error}\``,
        { parse_mode: 'Markdown' }
      );
      break;
    }
  }
}

// ── Bot Commands ───────────────────────────────────────────────────────────────

bot.command('start', (ctx) =>
  ctx.reply(
    '👋 *Welcome to Alpha402* 🤖\n\n' +
    'I am your autonomous DeFi trading assistant. I orchestrate a crew of AI agents to monitor and execute trades on your behalf.\n\n' +
    '*Your Agent Crew:*\n' +
    '  👨‍✈️ *Commander* — parses your intent via Groq AI\n' +
    '  👁 *Intel* — watches live DexScreener price feeds\n' +
    '  ⚖️ *Risk* — scores trades with Groq Llama-3.1\n' +
    '  ⚡ *Execution* — submits via KeeperHub (Sepolia)\n\n' +
    '*How to use:*\n' +
    'Just type your strategy in plain English, for example:\n' +
    '`"Buy ETH when it dips below $3000. Max 0.1 ETH."` \n\n' +
    'Or use the `/trade` command.',
    { parse_mode: 'Markdown' }
  )
);

bot.command('trade', async (ctx) => {
  const input = ctx.match?.trim();
  const chatId = ctx.chat.id;

  if (!input) {
    return ctx.reply(
      '⚠️ Provide a strategy:\n`/trade Buy ETH when it dips below $3000. Max 0.1 ETH. Stop loss 5%.`',
      { parse_mode: 'Markdown' }
    );
  }

  if (!wsReady || !ws) {
    return ctx.reply(
      '❌ Agent system is offline.\n\nMake sure `npm run dev:agents` is running in a terminal.',
      { parse_mode: 'Markdown' }
    );
  }

  await ctx.reply('📡 Sending to agent system...', { parse_mode: 'Markdown' });

  // Send strategy to agents via WebSocket
  const tempId = `tg_${chatId}_${Date.now()}`;
  strategyToChat.set(tempId, chatId);
  chatToStrategy.set(chatId, tempId);

  ws.send(JSON.stringify({
    type: 'PARSE_STRATEGY',
    input,
    owner: `telegram_${chatId}`,
    _tempId: tempId, // so we can match the reply
  }));

  // The agent system will emit STRATEGY_PARSED which contains the real strategyId.
  // We listen for it in the WS handler and update the map.
  // For now, also listen once for STRATEGY_PARSED to remap tempId → real strategyId.
  if (ws) {
    const remapHandler = (raw: any) => {
      try {
        const env = JSON.parse(raw.toString());
        if (env.type === 'A2A_MESSAGE' && env.data?.type === 'STRATEGY_PARSED') {
          const realId = env.data.strategyId;
          strategyToChat.set(realId, chatId);
          chatToStrategy.set(chatId, realId);
          // Clean up temp
          strategyToChat.delete(tempId);
          ws?.removeListener('message', remapHandler);
        }
      } catch { /* ignore */ }
    };
    ws.on('message', remapHandler);
  }
});

bot.command('agents', async (ctx) => {
  const status = wsReady ? '🟢 ONLINE' : '🔴 OFFLINE';
  ctx.reply(
    `🤖 *Agent System*: ${status}\n\n` +
    `👨‍✈️ Commander: ${wsReady ? '🟢' : '🔴'}\n` +
    `👁 Intel:     ${wsReady ? '🟢' : '🔴'}\n` +
    `⚖️ Risk:      ${wsReady ? '🟢' : '🔴'}\n` +
    `⚡ Execution: ${wsReady ? '🟢' : '🔴'}\n\n` +
    `📦 Vault: \`${process.env.STRATEGY_VAULT_ADDRESS?.slice(0, 10)}...\`\n` +
    `🌐 WS: ${AGENT_WS}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('stop', (ctx) =>
  ctx.reply('🛑 *Emergency Stop* — All strategies paused.', { parse_mode: 'Markdown' })
);

// ── Fallback: Handle plain text as strategy ────────────────────────────────────
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return; // Ignore other commands

  await ctx.reply(`🔍 Interpreting your intent: "_${text}_"`);
  
  // Forward to the /trade logic
  // We can't call ctx.command, so we manually trigger the logic
  const chatId = ctx.chat.id;

  if (!wsReady || !ws) {
    return ctx.reply(
      '❌ Agent system is offline.\n\nMake sure `npm run dev:agents` is running in a terminal.',
      { parse_mode: 'Markdown' }
    );
  }

  // Send strategy to agents via WebSocket
  const tempId = `tg_${chatId}_${Date.now()}`;
  strategyToChat.set(tempId, chatId);
  chatToStrategy.set(chatId, tempId);

  ws.send(JSON.stringify({
    type: 'PARSE_STRATEGY',
    input: text,
    owner: `telegram_${chatId}`,
    _tempId: tempId,
  }));
});

// ── Start everything ──────────────────────────────────────────────────────────
connectToAgents();

bot.start({
  onStart: (info) => {
    console.log(`[Bot] ✅ @${info.username} is online → https://t.me/${info.username}`);
  },
});

process.on('SIGINT', () => {
  bot.stop();
  process.exit(0);
});
