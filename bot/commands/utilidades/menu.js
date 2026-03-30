import { sendMenuWithBanner } from '../../utils/menu.js';
import { formatError } from '../../utils/formatter.js';

export default {
  name: 'menu',
  aliases: ['help', 'commands', 'comandos'],
  description: 'Muestra el menú de comandos con el banner del bot',
  category: 'Utilidades',
  usage: '/menu',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const gs = await db.getGroupSettings(remote);
    let globalBanner = null;
    if (db.instanceId) {
      const r = await db.query(
        `SELECT menu_banner_url FROM bot_instances WHERE instance_id = ? LIMIT 1`,
        [db.instanceId]
      );
      globalBanner = r[0]?.menu_banner_url ? String(r[0].menu_banner_url) : null;
    }
    try {
      await sendMenuWithBanner(sock, remote, config, gs, globalBanner);
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'No se pudo enviar el menú.'),
      });
    }
  },
};
