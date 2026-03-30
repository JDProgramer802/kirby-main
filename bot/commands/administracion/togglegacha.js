import { formatSuccess, formatError } from '../../utils/formatter.js';

export default {
  name: 'togglegacha',
  aliases: [],
  description: 'Activa o desactiva el módulo gacha en el grupo',
  category: 'Administración',
  usage: '/togglegacha on|off|status',
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
        text: `Gacha: ${gs.gacha_enabled ? '✅ activado' : '❌ desactivado'}.`,
      });
      return;
    }
    if (sub !== 'on' && sub !== 'off') {
      await sock.sendMessage(remote, { text: formatError('Uso: /togglegacha on | off | status') });
      return;
    }
    const on = sub === 'on';
    await db.query(
      `INSERT INTO group_settings (jid, gacha_enabled) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET gacha_enabled = EXCLUDED.gacha_enabled`,
      [remote, on]
    );
    await sock.sendMessage(remote, {
      text: formatSuccess(on ? '¡Gacha encendido! 🎴' : 'Gacha apagado.'),
    });
  },
};
