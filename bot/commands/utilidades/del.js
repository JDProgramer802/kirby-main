import { formatError, formatSuccess } from '../../utils/formatter.js';
import { quotedMessage } from '../../utils/cmdHelpers.js';
import { isGroupAdmin } from '../../utils/permissions.js';

export default {
  name: 'del',
  aliases: ['delete'],
  description: 'Borra el mensaje citado (requiere admin del bot)',
  category: 'Utilidades',
  usage: '/del (cita)',
  cooldown: 2,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const botId = sock.user?.id || sock.authState?.creds?.me?.id;
    if (!botId || !(await isGroupAdmin(sock, remote, botId))) {
      await sock.sendMessage(remote, { text: formatError('El bot debe ser admin para borrar mensajes.') });
      return;
    }
    const q = quotedMessage(msg);
    if (!q) {
      await sock.sendMessage(remote, { text: formatError('Cita el mensaje a borrar.') });
      return;
    }
    const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId
      ? {
          remoteJid: remote,
          fromMe: msg.message.extendedTextMessage.contextInfo.participant === botId,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant,
        }
      : null;
    if (!key?.id) {
      await sock.sendMessage(remote, { text: formatError('No pude leer la clave del mensaje citado.') });
      return;
    }
    try {
      await sock.sendMessage(remote, { delete: key });
      await sock.sendMessage(remote, { text: formatSuccess('Mensaje eliminado.') });
    } catch {
      await sock.sendMessage(remote, { text: formatError('No se pudo eliminar (permisos o mensaje antiguo).') });
    }
  },
};
