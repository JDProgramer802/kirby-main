import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setusername',
  aliases: [],
  description: 'Nombre visible del bot',
  category: 'Subbots',
  usage: '/setusername MiBot',
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
    if (!t || t.length > 25) {
      return sock.sendMessage(remote, { text: formatError('Nombre corto (máx 25).') });
    }
    try {
      await sock.updateProfileName(t);
      await sock.sendMessage(remote, { text: formatSuccess('Nombre actualizado.') });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
