import { formatError } from './formatter.js';
import { getMentions, actorJid } from './cmdHelpers.js';

/**
 * @param {string} [pushName]
 * @param {string} jid
 */
export function shortLabelFromJid(jid, pushName) {
  const num = String(jid).split('@')[0] ?? '';
  const pn = pushName?.trim();
  if (pn) return pn;
  return num || 'alguien';
}

export function actorLabel(msg, remote) {
  const jid = actorJid(msg, remote);
  return shortLabelFromJid(jid, msg.pushName);
}

/**
 * @param {unknown[]} phrases
 */
export function pickRandom(phrases) {
  const a = /** @type {string[]} */ (phrases);
  return a[Math.floor(Math.random() * a.length)] ?? '';
}

/**
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg
 * @param {{ getGroupSettings: (jid: string) => Promise<{ nsfw_enabled?: boolean }> }} db
 */
export async function assertNsfwGroup(sock, msg, db) {
  const remote = msg.key.remoteJid;
  if (!remote?.endsWith('@g.us')) {
    if (remote) {
      await sock.sendMessage(remote, { text: formatError('Los comandos NSFW solo se usan en grupos.') });
    }
    return null;
  }
  const gs = await db.getGroupSettings(remote);
  if (!gs?.nsfw_enabled) {
    await sock.sendMessage(remote, {
      text: formatError('El módulo NSFW está desactivado en este grupo (/setnsfw on).'),
    });
    return null;
  }
  return { remote, gs };
}

/**
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg
 * @param {string} remote
 * @param {boolean} [requireTarget]
 */
export function resolveMentionTarget(_sock, msg, remote, requireTarget = true) {
  const men = getMentions(msg);
  const target = men[0];
  if (requireTarget && !target) {
    return { ok: false, target: null, actor: actorJid(msg, remote) };
  }
  return { ok: true, target, actor: actorJid(msg, remote) };
}
