import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setbotowner',
  aliases: [],
  description: 'Transfiere dueño en BD (reinicia después)',
  category: 'Subbots',
  usage: '/setbotowner 521234567890',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const num = (args[0] ?? '').replace(/\D/g, '');
    if (num.length < 10) {
      return sock.sendMessage(remote, { text: formatError('Pasa el número con código de país.') });
    }
    const jid = `${num}@s.whatsapp.net`;
    await db.query(`UPDATE bot_instances SET owner_jid = ? WHERE instance_id = ?`, [
      jid,
      db.instanceId ?? 'main',
    ]);
    await sock.sendMessage(remote, {
      text: formatSuccess(`Dueño en BD: ${jid}. Actualiza BOT_OWNER en .env y reinicia.`),
    });
  },
};
