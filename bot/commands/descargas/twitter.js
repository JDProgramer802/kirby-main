import { formatError } from '../../utils/formatter.js';
import { cobaltResolve } from '../../utils/cobaltFetch.js';

export default {
  name: 'twitter',
  aliases: ['tw', 'x'],
  description: 'Descarga video de X/Twitter (API cobalt)',
  category: 'Descargas',
  usage: '/twitter <url>',
  cooldown: 20,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, _db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const url = args.join(' ').trim();
    if (!url || !/twitter\.com|x\.com/i.test(url)) {
      return sock.sendMessage(remote, { text: formatError('Pega un enlace de X/Twitter.') });
    }
    try {
      const { url: media, isVideo } = await cobaltResolve(url);
      if (isVideo) {
        await sock.sendMessage(remote, { video: { url: media }, mimetype: 'video/mp4' });
      } else {
        await sock.sendMessage(remote, { image: { url: media } });
      }
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Falló Twitter/X'),
      });
    }
  },
};
