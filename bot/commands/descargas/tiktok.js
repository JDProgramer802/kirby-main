import { formatError } from '../../utils/formatter.js';

export default {
  name: 'tiktok',
  aliases: ['tt', 'tdl'],
  description: 'Descarga video TikTok (sin marca de agua si el servicio responde)',
  category: 'Descargas',
  usage: '/tiktok <url>',
  cooldown: 15,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, _db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const url = args.join(' ').trim();
    if (!url || !/tiktok\.com|vm\.tiktok/i.test(url)) {
      return sock.sendMessage(remote, { text: formatError('Pega un enlace de TikTok.') });
    }
    let j;
    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
        headers: { 'user-agent': 'KirbyBot/1.0' },
      });
      j = await res.json();
    } catch (e) {
      return sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Red error'),
      });
    }
    if (j?.code !== 0 || !j?.data?.play) {
      return sock.sendMessage(remote, {
        text: formatError('No se pudo resolver el video (servicio caído o URL inválida).'),
      });
    }
    const play = String(j.data.play);
    let vid;
    try {
      const r = await fetch(play, { headers: { 'user-agent': 'KirbyBot/1.0' } });
      if (!r.ok) throw new Error(String(r.status));
      const ab = await r.arrayBuffer();
      vid = Buffer.from(ab);
    } catch (e) {
      return sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Descarga fallida'),
      });
    }
    const cap = j.data?.title ? String(j.data.title).slice(0, 900) : '';
    try {
      await sock.sendMessage(remote, {
        video: vid,
        mimetype: 'video/mp4',
        caption: cap || undefined,
      });
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'WA no aceptó el video'),
      });
    }
  },
};
