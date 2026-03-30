import { formatSuccess, formatError } from '../../utils/formatter.js';

export default {
  name: 'toggleconomy',
  aliases: [],
  description: 'Activa o desactiva el módulo de economía en el grupo',
  category: 'Administración',
  usage: '/toggleconomy on|off|status',
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
        text: `Economía: ${gs.economy_enabled ? '✅ activada' : '❌ desactivada'}.`,
      });
      return;
    }
    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, { text: formatError('Uso: /toggleconomy on | off | status') });
      return;
    }
    const on = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, economy_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET economy_enabled = EXCLUDED.economy_enabled`,
      [remote, on]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(on ? '¡Economía encendida! 💰' : 'Economía apagada. Los comandos quedan congelados.'),
    });
  },
};
