import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'bot',
  aliases: ['togglebot'],
  description: 'Activa o desactiva todos los comandos del bot en el grupo',
  category: 'Administración',
  usage: '/bot on|off|status',
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
      const on = gs.bot_enabled !== false;
      await sock.sendMessage(remote, {
        text: `Bot: ${on ? '✅ activo' : '❌ desactivado'} (comandos).`,
      });
      return;
    }
    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, { text: formatError('Uso: /bot on | off | status') });
      return;
    }
    const on = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, bot_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET bot_enabled = EXCLUDED.bot_enabled`,
      [remote, on]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(on ? 'Comandos del bot activados.' : 'Comandos del bot desactivados en este grupo.'),
    });
  },
};
