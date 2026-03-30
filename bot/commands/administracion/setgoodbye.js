import { formatSuccess, formatError } from '../../utils/formatter.js';

function quotedText(msg) {
  const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!q) return '';
  return (
    q.conversation ||
    q.extendedTextMessage?.text ||
    q.imageMessage?.caption ||
    ''
  );
}

export default {
  name: 'setgoodbye',
  aliases: [],
  description: 'Define el mensaje de despedida (variables: {user} {group} {tag})',
  category: 'Administración',
  usage: '/setgoodbye [texto]',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const text = (args.length ? args.join(' ') : quotedText(msg)).trim();
    if (!text) {
      await sock.sendMessage(remote, {
        text: formatError('Uso: /setgoodbye [texto] o responde a un mensaje.'),
      });
      return;
    }
    await db.query(
      `INSERT INTO group_settings (jid, goodbye_message) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET goodbye_message = EXCLUDED.goodbye_message`,
      [remote, text]
    );
    await sock.sendMessage(remote, { text: formatSuccess('Mensaje de despedida actualizado.') });
  },
};
