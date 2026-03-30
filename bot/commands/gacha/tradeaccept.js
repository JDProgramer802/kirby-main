import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'tradeaccept',
  aliases: ['aceptartrade'],
  description: 'Acepta el último intercambio pendiente hacia ti',
  category: 'Gacha',
  usage: '/tradeaccept',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    const rows = await db.query(
      `SELECT * FROM gacha_trades
       WHERE group_jid = ? AND target_jid = ? AND status = 'pending'
       ORDER BY id DESC
       LIMIT 1`,
      [remote, user]
    );
    const t = rows[0];
    if (!t) {
      return sock.sendMessage(remote, { text: formatError('No tienes intercambios pendientes.') });
    }
    const offerId = Number(t.offer_character_id);
    const wantId = Number(t.want_character_id);
    const proposer = String(t.proposer_jid);

    const proposerHas = await db.query(
      `SELECT 1 FROM gacha_claims WHERE group_jid = ? AND character_id = ? AND owner_jid = ? LIMIT 1`,
      [remote, offerId, proposer]
    );
    const targetHas = await db.query(
      `SELECT 1 FROM gacha_claims WHERE group_jid = ? AND character_id = ? AND owner_jid = ? LIMIT 1`,
      [remote, wantId, user]
    );
    if (!proposerHas.length || !targetHas.length) {
      await db.query(`UPDATE gacha_trades SET status = 'cancelled' WHERE id = ?`, [t.id]);
      return sock.sendMessage(remote, {
        text: formatError('Ya no se cumplen las condiciones del intercambio.'),
      });
    }

    await db.query(`UPDATE gacha_claims SET owner_jid = ? WHERE group_jid = ? AND character_id = ?`, [
      user,
      remote,
      offerId,
    ]);
    await db.query(`UPDATE gacha_claims SET owner_jid = ? WHERE group_jid = ? AND character_id = ?`, [
      proposer,
      remote,
      wantId,
    ]);
    await db.query(`UPDATE gacha_trades SET status = 'done' WHERE id = ?`, [t.id]);

    await sock.sendMessage(remote, {
      text: formatSuccess(`Intercambio hecho: #${offerId} ↔ #${wantId}`),
      mentions: [user, proposer],
    });
  },
};
