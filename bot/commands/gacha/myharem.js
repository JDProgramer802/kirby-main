import { formatError } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'myharem',
  aliases: ['harem', 'mycollection'],
  description: 'Lista tus personajes reclamados en el grupo',
  category: 'Gacha',
  usage: '/myharem',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    const rows = await db.query(
      `SELECT gc.name, gc.series, gc.rarity, gc.base_value, c.character_id, c.claimed_at
       FROM gacha_claims c
       JOIN gacha_characters gc ON gc.id = c.character_id
       WHERE c.group_jid = ? AND c.owner_jid = ?
       ORDER BY c.claimed_at DESC
       LIMIT 25`,
      [remote, user]
    );
    if (!rows.length) {
      return sock.sendMessage(remote, { text: formatError('Aún no tienes personajes. Usa /rollwaifu y /claim.') });
    }
    let t = `🎴 *Tu colección* (${rows.length})\n\n`;
    rows.forEach((r, i) => {
      t += `${i + 1}. *${r.name}* · ${r.series} · ${r.rarity} · #${r.character_id}\n`;
    });
    await sock.sendMessage(remote, { text: t });
  },
};
