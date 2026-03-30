import { downloadMediaMessage } from '@itsukichan/baileys';
import * as github from '../../utils/github.js';
import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setglobalbanner',
  aliases: ['setmenubanner', 'setbotbanner'],
  description: 'Banner global del menú (GitHub + BD)',
  category: 'Subbots',
  usage: '/setbanner (imagen o cita)',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = msg.message?.imageMessage || q?.imageMessage;
    if (!img) {
      return sock.sendMessage(remote, { text: formatError('Envía o cita una imagen.') });
    }
    const mediaMsg =
      msg.message?.imageMessage != null
        ? msg
        : { ...msg, message: { imageMessage: q?.imageMessage } };
    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage,
    });
    if (!buffer || !(buffer instanceof Buffer)) {
      return sock.sendMessage(remote, { text: formatError('No se pudo leer la imagen.') });
    }
    let url;
    try {
      if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) throw new Error('GitHub no configurado');
      url = await github.uploadFile(buffer, `menu_${db.instanceId ?? 'main'}.png`, 'banners');
    } catch (e) {
      return sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Subida fallida'),
      });
    }
    await db.query(`UPDATE bot_instances SET menu_banner_url = ? WHERE instance_id = ?`, [
      url,
      db.instanceId ?? 'main',
    ]);
    await sock.sendMessage(remote, { text: formatSuccess('Banner global del menú actualizado.') });
  },
};
