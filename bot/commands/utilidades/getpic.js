import { formatError } from '../../utils/formatter.js';
import { getMentions, actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'getpic',
  aliases: ['pfp'],
  description: 'Foto de perfil',
  category: 'Utilidades',
  usage: '/getpic [@usuario]',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const me = actorJid(msg, remote);
    const men = getMentions(msg);
    const target = men[0] ?? me;
    try {
      const url = await sock.profilePictureUrl(target, 'image');
      if (!url) {
        await sock.sendMessage(remote, { text: 'Sin foto de perfil.' });
        return;
      }
      await sock.sendMessage(remote, { image: { url }, caption: `@${String(target).split('@')[0]}` });
    } catch {
      await sock.sendMessage(remote, { text: formatError('No se pudo obtener la foto.') });
    }
  },
};
