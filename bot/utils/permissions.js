import { PermissionLevel } from './permissionLevels.js';

export { PermissionLevel };

/**
 * Normaliza JID de usuario.
 * @param {string} jid
 */
export function normalizeUserJid(jid) {
  if (!jid) return '';
  const s = String(jid);
  if (s.includes('@')) return s.split(':')[0];
  return s;
}

/**
 * @param {string} jid
 * @param {string[]} ownerNumbers
 */
export function isOwner(jid, ownerNumbers) {
  const j = normalizeUserJid(jid);
  return ownerNumbers.some((o) => normalizeUserJid(o) === j);
}

/**
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {string} groupJid
 * @param {string} userJid
 */
export async function isGroupAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const u = normalizeUserJid(userJid);
    const admins = meta.participants
      .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
      .map((p) => normalizeUserJid(p.id));
    return admins.includes(u);
  } catch {
    return false;
  }
}

/**
 * @param {import('@itsukichan/baileys').WASocket} sock
 * @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg
 * @param {ReturnType<import('../config/botConfig.js').buildBotConfig>} config
 */
export async function getPermissionLevel(sock, msg, config) {
  const remote = msg.key.remoteJid;
  const participant = msg.key.participant ?? msg.participant ?? remote;
  const from = normalizeUserJid(participant);

  if (isOwner(from, config.ownerNumbers)) return PermissionLevel.OWNER;

  const isGroup = Boolean(remote && remote.endsWith('@g.us'));
  if (isGroup) {
    const admin = await isGroupAdmin(sock, remote, from);
    if (admin) return PermissionLevel.GROUP_ADMIN;
  }

  return PermissionLevel.MEMBER;
}

/**
 * @param {import('./permissionLevels.js').PermissionLevel} level
 * @param {import('../types/command.js').CommandModule} cmd
 */
export function canRunCommand(level, cmd) {
  if (cmd.ownerOnly && level !== PermissionLevel.OWNER) return false;
  if (cmd.adminOnly && level !== PermissionLevel.OWNER && level !== PermissionLevel.GROUP_ADMIN) {
    return false;
  }
  return true;
}
