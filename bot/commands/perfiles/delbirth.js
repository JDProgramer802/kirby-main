import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'delbirth',
  aliases: [],
  description: 'Borra tu cumpleaños (confirma con confirmar)',
  category: 'Perfiles',
  usage: '/delbirth confirmar',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    if ((args[0] ?? '').toLowerCase() !== 'confirmar') {
      await sock.sendMessage(remote, {
        text: formatError('Escribe /delbirth confirmar para borrar tu fecha.'),
      });
      return;
    }
    await db.query(`UPDATE group_profiles SET birth_date = NULL WHERE group_jid = ? AND user_jid = ?`, [
      remote,
      user,
    ]);
    await sock.sendMessage(remote, { text: formatSuccess('Cumpleaños eliminado.') });
  },
};
