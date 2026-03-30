import { downloadMediaMessage } from '@itsukichan/baileys';
import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setpfp',
  aliases: ['setimage'],
  description: 'Foto de perfil del bot',
  category: 'Subbots',
  usage: '/setpfp (imagen)',
  cooldown: 15,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const img = msg.message?.imageMessage || q?.imageMessage;
    if (!img) return sock.sendMessage(remote, { text: formatError('Cita o envía imagen.') });
    const mediaMsg =
      msg.message?.imageMessage != null
        ? msg
        : { ...msg, message: { imageMessage: q?.imageMessage } };
    const buf = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
      reuploadRequest: sock.updateMediaMessage,
    });
    if (!buf || !(buf instanceof Buffer)) {
      return sock.sendMessage(remote, { text: formatError('Buffer inválido.') });
    }
    const me = sock.authState?.creds?.me?.id;
    if (!me) return sock.sendMessage(remote, { text: formatError('Sin sesión.') });
    try {
      await sock.updateProfilePicture(me, buf);
      await sock.sendMessage(remote, { text: formatSuccess('Foto de perfil actualizada.') });
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Error'),
      });
    }
  },
};
