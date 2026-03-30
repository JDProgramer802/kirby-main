import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setstatus',
  aliases: [],
  description: 'Estado (about) del bot',
  category: 'Subbots',
  usage: '/setstatus texto',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const t = args.join(' ').trim();
    if (!t || t.length > 120) {
      return sock.sendMessage(remote, { text: formatError('Texto 1–120 caracteres.') });
    }
    try {
      await sock.updateProfileStatus(t);
      await sock.sendMessage(remote, { text: formatSuccess('Estado actualizado.') });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
