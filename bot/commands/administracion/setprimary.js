import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions } from '../../utils/cmdHelpers.js';

export default {
  name: 'setprimary',
  aliases: ['botprincipal'],
  description: 'Marca el JID del bot principal del grupo (mención)',
  category: 'Administración',
  usage: '/setprimary @bot',
  cooldown: 5,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const men = getMentions(msg);
    const botJid = men[0];
    if (!botJid) {
      return sock.sendMessage(remote, { text: formatError('Menciona al bot.') });
    }
    await db.query(
      `INSERT INTO group_settings (jid, primary_bot_jid) VALUES (?, ?)
       ON CONFLICT (jid) DO UPDATE SET primary_bot_jid = EXCLUDED.primary_bot_jid`,
      [remote, botJid]
    );
    await sock.sendMessage(remote, { text: formatSuccess('Bot principal guardado.') });
  },
};
