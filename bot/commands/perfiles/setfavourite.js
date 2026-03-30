import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'setfavourite',
  aliases: ['setfav'],
  description: 'Personaje favorito (de tu harem)',
  category: 'Perfiles',
  usage: '/setfavourite nombre personaje',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const name = args.join(' ').trim();
    if (!name) {
      await sock.sendMessage(remote, { text: formatError('Indica el nombre del personaje.') });
      return;
    }
    const ok = await db.query(
      `SELECT c.name FROM gacha_claims gc
       JOIN gacha_characters c ON c.id = gc.character_id
       WHERE gc.group_jid = ? AND gc.owner_jid = ? AND LOWER(c.name) = LOWER(?) LIMIT 1`,
      [remote, me, name]
    );
    if (!ok[0]) {
      await sock.sendMessage(remote, {
        text: formatError('No tienes ese personaje reclamado en este grupo.'),
      });
      return;
    }
    await db.query(
      `INSERT INTO group_profiles (group_jid, user_jid, fav_char_name) VALUES (?, ?, ?)
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET fav_char_name = EXCLUDED.fav_char_name`,
      [remote, me, String(ok[0].name)]
    );
    await sock.sendMessage(remote, { text: formatSuccess(`Favorito: *${ok[0].name}*`) });
  },
};
