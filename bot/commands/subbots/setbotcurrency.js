import { formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'setbotcurrency',
  aliases: [],
  description: 'Nombre de la moneda (instancia)',
  category: 'Subbots',
  usage: '/setbotcurrency Stars',
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
    const name = args.join(' ').trim().slice(0, 40) || 'coins';
    await db.query(`UPDATE bot_instances SET currency_name = ? WHERE instance_id = ?`, [
      name,
      db.instanceId ?? 'main',
    ]);
    await sock.sendMessage(remote, { text: formatSuccess(`Moneda: *${name}*`) });
  },
};
