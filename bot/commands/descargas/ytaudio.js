import yts from 'yt-search';
import { formatError } from '../../utils/formatter.js';

export default {
  name: 'ytaudio',
  aliases: ['play', 'mp3'],
  description: 'Descarga audio de YouTube por enlace o búsqueda.',
  category: 'Descargas',
  usage: '/ytaudio <url o texto>',
  cooldown: 25,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, _db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const query = args.join(' ').trim();
    if (!query) {
      return sock.sendMessage(remote, { text: formatError('Pega un enlace de YouTube o escribe algo para buscar.') });
    }

    let url;
    if (/youtube\.com|youtu\.be/i.test(query)) {
      url = query;
    } else {
      try {
        const { videos } = await yts(query);
        if (!videos.length) {
          return sock.sendMessage(remote, { text: formatError('No se encontraron resultados para tu búsqueda.') });
        }
        url = videos[0].url;
      } catch (e) {
        console.error(e);
        return sock.sendMessage(remote, { text: formatError('Falló la búsqueda en YouTube.') });
      }
    }

    let ytdl;
    try {
      ytdl = (await import('@distube/ytdl-core')).default;
    } catch {
      return sock.sendMessage(remote, {
        text: formatError('Instala dependencias: npm install @distube/ytdl-core'),
      });
    }
    try {
      const info = await ytdl.getInfo(url);
      const fmt = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });
      if (!fmt?.url) throw new Error('Sin formato compatible');
      await sock.sendMessage(remote, {
        audio: { url: fmt.url },
        mimetype: 'audio/mp4',
      });
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Falló YouTube'),
      });
    }
  },
};
