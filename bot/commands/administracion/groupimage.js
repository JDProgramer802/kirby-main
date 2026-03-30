import { downloadMediaMessage } from '@itsukichan/baileys';
import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'groupimage',
  aliases: ['setgroupicon', 'iconogrupo'],
  description: 'Cambia la foto del grupo (responde a imagen o adjunta)',
  category: 'Administración',
  usage: '/groupimage (imagen)',
  cooldown: 10,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, _db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;

    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = msg.message?.imageMessage || q?.imageMessage;
    if (!img) {
      await sock.sendMessage(remote, {
        text: formatError('Responde a una imagen o envía /groupimage con una imagen.'),
      });
      return;
    }

    const mediaMsg =
      msg.message?.imageMessage != null
        ? msg
        : { ...msg, message: { imageMessage: q?.imageMessage } };

    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage,
    });

    if (!buffer || !(buffer instanceof Buffer)) {
      await sock.sendMessage(remote, { text: formatError('No se pudo descargar la imagen.') });
      return;
    }

    try {
      await sock.updateProfilePicture(remote, buffer);
      await sock.sendMessage(remote, { text: formatSuccess('Foto del grupo actualizada.') });
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Error al actualizar.'),
      });
    }
  },
};
