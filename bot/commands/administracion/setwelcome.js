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
  name: 'setwelcome',
  aliases: [],
  description: 'Define el mensaje de bienvenida (variables: {user} {group} {tag})',
  category: 'Administración',
  usage: '/setwelcome [texto]',
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
        text: formatError('Uso: /setwelcome [texto] o responde a un mensaje.'),
      });
      return;
    }
    await db.query(
      `INSERT INTO group_settings (jid, welcome_message) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET welcome_message = EXCLUDED.welcome_message`,
      [remote, text]
    );
    await sock.sendMessage(remote, { text: formatSuccess('Mensaje de bienvenida actualizado.') });
  },
};
