import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'antilink',
  aliases: ['antienlaces'],
  description: 'Borra mensajes con enlaces (HTTP, wa.me, chat.whatsapp.com)',
  category: 'Administración',
  usage: '/antilink on|off|status',
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
      await sock.sendMessage(remote, {
        text: `Antilink: ${gs.antilink_enabled ? '✅ activo' : '❌ desactivado'}.`,
      });
      return;
    }
    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, { text: formatError('Uso: /antilink on | off | status') });
      return;
    }
    const on = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, antilink_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET antilink_enabled = EXCLUDED.antilink_enabled`,
      [remote, on]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(on ? 'Antilink activado.' : 'Antilink desactivado.'),
    });
  },
};
