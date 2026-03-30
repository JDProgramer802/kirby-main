import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';

export default {
  name: 'autojoin',
  aliases: [],
  description: 'Auto-unirse al recibir enlaces por DM (flag en BD)',
  category: 'Subbots',
  usage: '/autojoin enable|disable',
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
    const sub = (args[0] ?? '').toLowerCase();
    if (sub !== 'enable' && sub !== 'disable') {
      return sock.sendMessage(remote, { text: formatError('Usa enable o disable.') });
    }
    const on = sub === 'enable';
    await db.query(`UPDATE bot_instances SET autojoin_dm = ? WHERE instance_id = ?`, [
      on,
      db.instanceId ?? 'main',
    ]);
    await sock.sendMessage(remote, {
      text: formatSuccess(on ? 'Autojoin DM activado (requiere lógica en handler).' : 'Autojoin DM off.'),
    });
  },
};
