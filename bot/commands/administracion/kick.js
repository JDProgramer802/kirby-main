import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions, actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'kick',
  aliases: [],
  description: 'Expulsar miembro',
  category: 'Administración',
  usage: '/kick @usuario',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const men = getMentions(msg);
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const victim = men[0] || ctx?.participant;
    if (!victim || victim === actorJid(msg, remote)) {
      return sock.sendMessage(remote, { text: formatError('Menciona o cita al usuario.') });
    }
    try {
      await sock.groupParticipantsUpdate(remote, [victim], 'remove');
      await sock.sendMessage(remote, { text: formatSuccess('Usuario expulsado.') });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
