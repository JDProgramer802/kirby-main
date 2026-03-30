import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'onlyadmin',
  aliases: ['onlyadmins', 'soloadmin', 'soloadmins'],
  description: 'Solo admins pueden usar comandos del bot',
  category: 'Administración',
  usage: '/onlyadmin on|off|status',
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
        text: `Solo admins: ${gs.only_admin_commands ? '✅ sí' : '❌ no'}.`,
      });
      return;
    }
    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, { text: formatError('Uso: /onlyadmin on | off | status') });
      return;
    }
    const on = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, only_admin_commands) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET only_admin_commands = EXCLUDED.only_admin_commands`,
      [remote, on]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(
        on ? 'Solo administradores pueden usar comandos del bot.' : 'Todos pueden usar comandos (según permisos).'
      ),
    });
  },
};
