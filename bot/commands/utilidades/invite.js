import { formatError, formatSuccess } from '../../utils/formatter.js';
import { parseInviteCode } from '../../utils/cmdHelpers.js';

export default {
  name: 'invite',
  aliases: [],
  description: 'Enlace de invitación del grupo o unirse con enlace',
  category: 'Utilidades',
  usage: '/invite [enlace]',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    if (args[0]) {
      const code = parseInviteCode(args.join(' '));
      try {
        await sock.groupAcceptInvite(code);
        await sock.sendMessage(remote, { text: formatSuccess('Unión al grupo solicitada.') });
      } catch (e) {
        await sock.sendMessage(remote, {
          text: formatError(e instanceof Error ? e.message : 'No se pudo unir con ese enlace.'),
        });
      }
      return;
    }
    if (!remote.endsWith('@g.us')) {
      await sock.sendMessage(remote, { text: formatError('En grupo usa /invite sin args para el link.') });
      return;
    }
    try {
      const code = await sock.groupInviteCode(remote);
      await sock.sendMessage(remote, {
        text: formatSuccess(`https://chat.whatsapp.com/${code}`),
      });
    } catch {
      await sock.sendMessage(remote, { text: formatError('No pude generar invitación (¿eres admin?).') });
    }
  },
};
