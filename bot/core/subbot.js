import {
  DisconnectReason,
  makeWASocket,
  fetchLatestBaileysVersion,
  Browsers,
} from '@itsukichan/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import { upsertBotInstance } from '../database/db.js';
import { registerInstance, unregisterInstance } from '../utils/botRegistry.js';
import { handleGroupParticipantsUpdate, handleMessagesUpsert } from './handler.js';
import { loadAuthState } from './session.js';

/** @typedef {ReturnType<import('../config/botConfig.js').buildBotConfig>} BotConfigInstance */

/** Reintentos de reconexión por instancia (se resetea al abrir sesión). */
const reconnectCount = new Map();

const MAX_RECONNECTS = 25;

/**
 * @param {{ error?: unknown } | null | undefined} lastDisconnect
 */
function getDisconnectCode(lastDisconnect) {
  const e = /** @type {any} */ (lastDisconnect)?.error;
  if (!e) return undefined;
  const c = e.output?.statusCode ?? e.statusCode;
  if (typeof c === 'number') return c;
  const msg = String(e.message ?? '');
  const m = msg.match(/Unexpected server response:\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

/**
 * @param {object} opts
 * @param {BotConfigInstance} opts.config
 * @param {string} opts.sessionDir
 * @param {string} [opts.instanceId]
 */
export async function startSubBot(opts) {
  const { config, sessionDir, instanceId = config.id } = opts;

  /** @type {Map<string, number>} */
  const cooldowns = new Map();

  const ctx = {
    config,
    sessionDir,
    instanceId,
    cooldowns,
  };

  const { state, saveCreds } = await loadAuthState(sessionDir);
  const logger = pino({ level: process.env.LOG_LEVEL ?? 'silent' });

  let waVersion;
  if (process.env.WA_SKIP_VERSION_FETCH !== '1') {
    const v = await fetchLatestBaileysVersion().catch(() => null);
    waVersion = v?.version;
    if (v && !v.isLatest) {
      console.warn(`[${instanceId}] Usando versión WA empaquetada (fetch falló).`);
    }
  }

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
    version: waVersion,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 90_000,
    keepAliveIntervalMs: 20_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { qr, connection, lastDisconnect } = update;
    if (qr) qrcodeTerminal.generate(qr, { small: true });
    if (connection === 'close') {
      unregisterInstance(instanceId);
      const code = getDisconnectCode(lastDisconnect);
      const errMsg = String(/** @type {any} */ (lastDisconnect?.error)?.message ?? '');
      const n = (reconnectCount.get(instanceId) ?? 0) + 1;
      reconnectCount.set(instanceId, n);

      const shouldReconnect =
        code !== DisconnectReason.loggedOut && code !== 401 && n <= MAX_RECONNECTS;

      console.log(
        `[${instanceId}] Conexión cerrada. Código: ${code ?? '?'}. ${errMsg ? `(${errMsg.slice(0, 120)})` : ''} Reconectar: ${shouldReconnect} (${n}/${MAX_RECONNECTS})`
      );

      if (code === 405 || code === 408) {
        console.warn(
          `[${instanceId}] 405/408: prueba borrar la sesión, otra red, o NODE_OPTIONS=--dns-result-order=ipv4first`
        );
      }

      if (shouldReconnect) {
        const delay = Math.min(2000 + (n - 1) * 1500, 45_000);
        setTimeout(() => {
          startSubBot(opts).catch((e) => console.error(e));
        }, delay);
      } else if (n > MAX_RECONNECTS) {
        console.error(
          `[${instanceId}] Límite de reintentos. Borra la carpeta: ${sessionDir} y vuelve a escanear el QR.`
        );
      }
    } else if (connection === 'open') {
      reconnectCount.delete(instanceId);
      console.log(`[${instanceId}] Conectado como ${config.name}`);
      registerInstance(instanceId, sock, config);
      const owner = config.ownerNumbers?.[0] ?? '';
      upsertBotInstance(
        instanceId,
        owner,
        String(config.name ?? instanceId).slice(0, 120),
        String(config.name ?? instanceId).slice(0, 250),
        'coins'
      ).catch((e) => console.error('[upsertBotInstance]', e));
    }
  });

  sock.ev.on('messages.upsert', (upsert) => {
    handleMessagesUpsert(sock, upsert, ctx).catch((e) => console.error('[messages.upsert]', e));
  });

  sock.ev.on('group-participants.update', (u) => {
    handleGroupParticipantsUpdate(sock, u, ctx).catch((e) =>
      console.error('[group-participants]', e)
    );
  });

  return sock;
}
