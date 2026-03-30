import { downloadMediaMessage } from '@itsukichan/baileys';
import sharp from 'sharp';
import { formatError } from '../../utils/formatter.js';

export default {
  name: 'sticker',
  aliases: ['s', 'stick'],
  description: 'Imagen → sticker WebP',
  category: 'Stickers',
  usage: '/sticker (cita o adjunta imagen)',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, _db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;

    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = msg.message?.imageMessage || q?.imageMessage;
    if (!img) {
      return sock.sendMessage(remote, {
        text: formatError('Responde a una imagen o envía una con el comando.'),
      });
    }

    const mediaMsg =
      msg.message?.imageMessage != null
        ? msg
        : { ...msg, message: { imageMessage: q?.imageMessage } };

    let buf;
    try {
      buf = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
        reuploadRequest: sock.updateMediaMessage,
      });
    } catch {
      return sock.sendMessage(remote, { text: formatError('No se pudo descargar el medio.') });
    }
    if (!buf || !(buf instanceof Buffer)) {
      return sock.sendMessage(remote, { text: formatError('Buffer vacío.') });
    }

    try {
      const webp = await sharp(buf)
        .resize(512, 512, { fit: 'inside' })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      await sock.sendMessage(remote, { sticker: webp });
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'No se pudo crear el sticker.'),
      });
    }
  },
};
