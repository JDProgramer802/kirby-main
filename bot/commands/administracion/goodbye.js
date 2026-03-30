import { formatSuccess, formatError } from '../../utils/formatter.js';

export default {
  name: 'goodbye',
  aliases: ['despedida'],
  description: 'Activa o desactiva los mensajes de despedida',
  category: 'Administración',
  usage: '/goodbye on|off|status',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const sub = (args[0] ?? 'status').toLowerCase();
    const gs = await db.getGroupSettings(remote);

    if (sub === 'status' || sub === 'estado') {
      const on = Boolean(gs.goodbye_enabled ?? true);
      await sock.sendMessage(remote, {
        text: `Despedida: ${on ? 'activada' : 'desactivada'}.`,
      });
      return;
    }

    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, {
        text: formatError('Uso: /goodbye on | off | status'),
      });
      return;
    }

    const enabled = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, goodbye_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET goodbye_enabled = EXCLUDED.goodbye_enabled`,
      [remote, enabled]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(`Despedida ${enabled ? 'activada' : 'desactivada'}.`),
    });
  },
};
