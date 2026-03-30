import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions } from '../../utils/cmdHelpers.js';

export default {
  name: 'promote',
  aliases: [],
  description: 'Ascender a admin',
  category: 'Administración',
  usage: '/promote @user',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const men = getMentions(msg);
    const v = men[0];
    if (!v) return sock.sendMessage(remote, { text: formatError('Menciona al usuario.') });
    try {
      await sock.groupParticipantsUpdate(remote, [v], 'promote');
      await sock.sendMessage(remote, { text: formatSuccess('Promovido.') });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
