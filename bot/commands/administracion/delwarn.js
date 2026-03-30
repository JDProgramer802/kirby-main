import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions } from '../../utils/cmdHelpers.js';

export default {
  name: 'delwarn',
  aliases: [],
  description: 'Borra warn por id',
  category: 'Administración',
  usage: '/delwarn @user número',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const men = getMentions(msg);
    const victim = men[0];
    const n = parseInt(args[args.length - 1] ?? '', 10);
    if (!victim || !Number.isFinite(n)) {
      return sock.sendMessage(remote, { text: formatError('/delwarn @user id') });
    }
    const r = await db.query(
      `DELETE FROM group_warns WHERE id = ? AND group_jid = ? AND user_jid = ? RETURNING id`,
      [n, remote, victim]
    );
    if (!r.length) {
      return sock.sendMessage(remote, { text: formatError('No encontrado.') });
    }
    await sock.sendMessage(remote, { text: formatSuccess('Warn eliminado.') });
  },
};
