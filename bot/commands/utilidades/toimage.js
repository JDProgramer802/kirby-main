import { formatError } from '../../utils/formatter.js';
import { downloadMediaMessage } from '@itsukichan/baileys';
import sharp from 'sharp';

export default {
  name: 'toimage',
  aliases: ['toimg'],
  description: 'Sticker citado → PNG',
  category: 'Utilidades',
  usage: '/toimage (cita sticker)',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const st = q?.stickerMessage;
    if (!st) {
      await sock.sendMessage(remote, { text: formatError('Cita un sticker.') });
      return;
    }
    const fake = { ...msg, message: { stickerMessage: st } };
    try {
      const buf = await downloadMediaMessage(fake, 'buffer', {}, {
        reuploadRequest: sock.updateMediaMessage,
      });
      if (!buf || !(buf instanceof Buffer)) throw new Error('buffer');
      const png = await sharp(buf).png().toBuffer();
      await sock.sendMessage(remote, { image: png, mimetype: 'image/png' });
    } catch {
      await sock.sendMessage(remote, { text: formatError('No se pudo convertir el sticker.') });
    }
  },
};
