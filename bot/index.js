import dotenv from 'dotenv';

dotenv.config();

import { buildBotConfig } from './config/botConfig.js';
import { ensureTables, runSchemaMigrations } from './database/db.js';
import { applyPanelConfigFromDb } from './database/panelConfig.js';
import { loadCommands } from './core/loader.js';
import { startSubBot } from './core/subbot.js';

await runSchemaMigrations().catch((e) => {
  console.error('[migrations]', e);
});
await ensureTables();
await applyPanelConfigFromDb();
await loadCommands();

/**
 * @typedef {{ id?: string, name?: string, prefix?: string, sessionDir?: string, ownerNumbers?: string[] }} SubBotDef
 */

/** @type {SubBotDef[]} */
let instances = [];

const raw = process.env.SUBBOTS?.trim();
if (raw) {
  try {
    instances = JSON.parse(raw);
  } catch {
    console.error('SUBBOTS no es JSON válido. Usando instancia por defecto.');
  }
}

if (!instances.length) {
  instances = [
    {
      id: 'main',
      name: process.env.BOT_NAME ?? 'WhatsApp Bot',
      prefix: process.env.BOT_PREFIX ?? '/',
      sessionDir: process.env.SESSION_DIR ?? './sessions/main',
    },
  ];
}

const sockets = [];
for (const inst of instances) {
  const config = buildBotConfig(inst);
  const sessionDir = inst.sessionDir ?? `./sessions/${inst.id ?? 'main'}`;
  const sock = await startSubBot({ config, sessionDir, instanceId: config.id });
  sockets.push(sock);
}

console.log(`Arrancadas ${sockets.length} instancia(s).`);
