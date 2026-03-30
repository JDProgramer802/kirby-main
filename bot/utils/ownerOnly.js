import { formatError } from './formatter.js';
import { isOwner, normalizeUserJid } from './permissions.js';

/**
 * @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg
 * @param {string} remote
 * @param {string[]} ownerNumbers
 */
export function requireOwner(sock, msg, remote, ownerNumbers) {
  const uid = normalizeUserJid(msg.key.participant ?? remote);
  if (!isOwner(uid, ownerNumbers)) {
    return { ok: false, text: formatError('Solo el dueño del bot puede usar este comando.') };
  }
  return { ok: true };
}
