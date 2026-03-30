import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'setwarnlimit',
  aliases: [],
  description: 'Máximo de warns antes de expulsar',
  category: 'Administración',
  usage: '/setwarnlimit 3',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const n = parseInt(args[0] ?? '', 10);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      return sock.sendMessage(remote, { text: formatError('Número entre 1 y 20.') });
    }
    await db.query(
      `INSERT INTO group_settings (jid, warn_limit) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET warn_limit = EXCLUDED.warn_limit`,
      [remote, n]
    );
    await sock.sendMessage(remote, { text: formatSuccess(`Límite: ${n} warns.`) });
  },
};
