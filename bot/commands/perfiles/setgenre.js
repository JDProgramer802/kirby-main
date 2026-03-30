import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'setgenre',
  aliases: [],
  description: 'Género en perfil',
  category: 'Perfiles',
  usage: '/setgenre Hombre|Mujer',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    const g = (args[0] ?? '').toLowerCase();
    let v = '';
    if (g === 'hombre' || g === 'm') v = 'Hombre';
    else if (g === 'mujer' || g === 'f') v = 'Mujer';
    else {
      await sock.sendMessage(remote, { text: formatError('Usa: /setgenre Hombre o /setgenre Mujer') });
      return;
    }
    await db.query(
      `INSERT INTO group_profiles (group_jid, user_jid, gender) VALUES (?, ?, ?)
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET gender = EXCLUDED.gender`,
      [remote, user, v]
    );
    await sock.sendMessage(remote, { text: formatSuccess(`Género: ${v}`) });
  },
};
