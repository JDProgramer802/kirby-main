import { formatSuccess, formatError } from '../../utils/formatter.js';

export default {
  name: 'welcome',
  aliases: ['bienvenida'],
  description: 'Activa o desactiva los mensajes de bienvenida',
  category: 'Administración',
  usage: '/welcome on|off|status',
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
      const on = Boolean(gs.welcome_enabled ?? true);
      await sock.sendMessage(remote, {
        text: `Bienvenida: ${on ? 'activada' : 'desactivada'}.`,
      });
      return;
    }

    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, {
        text: formatError('Uso: /welcome on | off | status'),
      });
      return;
    }

    const enabled = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, welcome_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET welcome_enabled = EXCLUDED.welcome_enabled`,
      [remote, enabled]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(`Bienvenida ${enabled ? 'activada' : 'desactivada'}.`),
    });
  },
};
