import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';
import { getMember } from '../../utils/economyHelpers.js';

export default {
  name: 'buywaifu',
  aliases: ['buychar', 'comprarwaifu'],
  description: 'Compra un listado del mercado',
  category: 'Gacha',
  usage: '/buywaifu <id_listado>',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const buyer = actorJid(msg, remote);
    const listId = parseInt(args[0] ?? '', 10);
    if (!Number.isFinite(listId)) {
      return sock.sendMessage(remote, { text: formatError('Uso: /buywaifu <id> (número del /market).') });
    }
    const rows = await db.query(
      `SELECT * FROM gacha_market WHERE id = ? AND group_jid = ? AND active = TRUE LIMIT 1`,
      [listId, remote]
    );
    const m = rows[0];
    if (!m) return sock.sendMessage(remote, { text: formatError('Listado no encontrado.') });
    if (String(m.seller_jid) === String(buyer)) {
      return sock.sendMessage(remote, { text: formatError('No puedes comprarte a ti mismo.') });
    }
    const price = Number(m.price);
    const buyerRow = await getMember(db, remote, buyer);
    if (Number(buyerRow.wallet) < price) {
      return sock.sendMessage(remote, { text: formatError('No tienes suficientes monedas en cartera.') });
    }
    const seller = String(m.seller_jid);
    const charId = Number(m.character_id);

    await db.query(`UPDATE economy_members SET wallet = wallet - ? WHERE group_jid = ? AND user_jid = ?`, [
      price,
      remote,
      buyer,
    ]);
    await db.query(`UPDATE economy_members SET wallet = wallet + ? WHERE group_jid = ? AND user_jid = ?`, [
      price,
      remote,
      seller,
    ]);
    await db.query(`UPDATE gacha_claims SET owner_jid = ? WHERE group_jid = ? AND character_id = ?`, [
      buyer,
      remote,
      charId,
    ]);
    await db.query(`UPDATE gacha_market SET active = FALSE WHERE id = ?`, [listId]);

    await sock.sendMessage(remote, {
      text: formatSuccess(`Comprado por ${price} coins. Personaje #${charId} ahora es tuyo.`),
      mentions: [buyer, seller],
    });
  },
};
