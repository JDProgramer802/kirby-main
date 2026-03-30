import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'sellwaifu',
  aliases: ['sellchar', 'venderwaifu'],
  description: 'Publica un personaje tuyo en el mercado',
  category: 'Gacha',
  usage: '/sellwaifu <id_personaje> <precio>',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    const charId = parseInt(args[0] ?? '', 10);
    const price = parseInt(args[1] ?? '', 10);
    if (!Number.isFinite(charId) || !Number.isFinite(price) || price < 1) {
      return sock.sendMessage(remote, {
        text: formatError('Uso: /sellwaifu <id_personaje> <precio> (el id sale en /myharem).'),
      });
    }
    const own = await db.query(
      `SELECT 1 FROM gacha_claims WHERE group_jid = ? AND character_id = ? AND owner_jid = ? LIMIT 1`,
      [remote, charId, user]
    );
    if (!own.length) {
      return sock.sendMessage(remote, { text: formatError('No posees ese personaje.') });
    }
    await db.query(`UPDATE gacha_market SET active = FALSE WHERE group_jid = ? AND character_id = ? AND active = TRUE`, [
      remote,
      charId,
    ]);
    await db.query(
      `INSERT INTO gacha_market (group_jid, seller_jid, character_id, price, active) VALUES (?, ?, ?, ?, TRUE)`,
      [remote, user, charId, price]
    );
    await sock.sendMessage(remote, { text: formatSuccess(`Publicado por ${price} coins. Revisa /market`) });
  },
};
