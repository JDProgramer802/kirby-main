import { formatSuccess, formatError } from '../../utils/formatter.js';

export default {
  name: 'setnsfw',
  aliases: [],
  description: 'Activa o desactiva comandos NSFW en el menú de este grupo',
  category: 'Administración',
  usage: '/setnsfw on|off|status',
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
      const on = Boolean(gs.nsfw_enabled ?? false);
      await sock.sendMessage(remote, {
        text: `NSFW en menú: ${on ? 'activado' : 'desactivado'}.`,
      });
      return;
    }

    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, {
        text: formatError('Uso: /setnsfw on | off | status'),
      });
      return;
    }

    const enabled = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, nsfw_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET nsfw_enabled = EXCLUDED.nsfw_enabled`,
      [remote, enabled]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(`NSFW ${enabled ? 'activado' : 'desactivado'} para este grupo.`),
    });
  },
};
