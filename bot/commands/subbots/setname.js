import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setname',
  aliases: ['setbotname'],
  description: 'Nombre corto / largo del bot en BD',
  category: 'Subbots',
  usage: '/setname corto / largo',
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
    const raw = args.join(' ');
    const parts = raw.split(/\s*\/\s*/).map((s) => s.trim());
    if (parts.length < 2) {
      return sock.sendMessage(remote, { text: formatError('Uso: /setname Corto / Nombre largo del bot') });
    }
    const [short, long] = [parts[0], parts.slice(1).join(' / ')];
    await db.query(
      `INSERT INTO bot_instances (instance_id, owner_jid, short_name, long_name) VALUES (?, ?, ?, ?)
       ON CONFLICT (instance_id) DO UPDATE SET short_name = EXCLUDED.short_name, long_name = EXCLUDED.long_name`,
      [db.instanceId ?? 'main', config.ownerNumbers[0] ?? 'x@s.whatsapp.net', short.slice(0, 120), long.slice(0, 250)]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess('Nombres guardados. Reinicia el proceso para aplicar en WhatsApp si hace falta.'),
    });
  },
};
