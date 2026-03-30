import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'alerts',
  aliases: ['alertas', 'adminalerts'],
  description: 'Avisos en grupo al promover/degradar miembros',
  category: 'Administración',
  usage: '/alerts on|off|status',
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
        text: `Alertas admin: ${gs.admin_alerts_enabled ? '✅ activas' : '❌ desactivadas'}.`,
      });
      return;
    }
    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, { text: formatError('Uso: /alerts on | off | status') });
      return;
    }
    const on = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, admin_alerts_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET admin_alerts_enabled = EXCLUDED.admin_alerts_enabled`,
      [remote, on]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(on ? 'Alertas de admin activadas.' : 'Alertas desactivadas.'),
    });
  },
};
