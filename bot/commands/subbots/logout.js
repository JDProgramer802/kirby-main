import fs from 'fs/promises';
import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'logout',
  aliases: [],
  description: 'Borra carpeta de sesión (requiere re-emparejar)',
  category: 'Subbots',
  usage: '/logout',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const dir = db.sessionDir;
    if (!dir) {
      return sock.sendMessage(remote, { text: formatError('Sin sessionDir en contexto.') });
    }
    try {
      await fs.rm(dir, { recursive: true, force: true });
      await sock.sendMessage(remote, {
        text: formatSuccess('Sesión borrada. Reinicia el proceso y escanea QR de nuevo.'),
      });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
