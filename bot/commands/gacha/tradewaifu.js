import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions, actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'tradewaifu',
  aliases: ['trade', 'intercambio'],
  description: 'Propón intercambiar un personaje tuyo por uno del otro usuario',
  category: 'Gacha',
  usage: '/tradewaifu @user <tu_char_id> <su_char_id>',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const proposer = actorJid(msg, remote);
    const men = getMentions(msg);
    const target = men[0];
    const offerId = parseInt(args[args.length - 2] ?? '', 10);
    const wantId = parseInt(args[args.length - 1] ?? '', 10);
    if (!target || !Number.isFinite(offerId) || !Number.isFinite(wantId)) {
      return sock.sendMessage(remote, {
        text: formatError('Uso: /tradewaifu @user <id_tuyo> <id_de_él>'),
      });
    }
    if (target === proposer) {
      return sock.sendMessage(remote, { text: formatError('Menciona a otra persona.') });
    }
    const o = await db.query(
      `SELECT 1 FROM gacha_claims WHERE group_jid = ? AND character_id = ? AND owner_jid = ? LIMIT 1`,
      [remote, offerId, proposer]
    );
    const w = await db.query(
      `SELECT 1 FROM gacha_claims WHERE group_jid = ? AND character_id = ? AND owner_jid = ? LIMIT 1`,
      [remote, wantId, target]
    );
    if (!o.length || !w.length) {
      return sock.sendMessage(remote, {
        text: formatError('Alguno no posee el personaje indicado.'),
      });
    }
    await db.query(
      `INSERT INTO gacha_trades (group_jid, proposer_jid, target_jid, offer_character_id, want_character_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [remote, proposer, target, offerId, wantId]
    );
    const tn = String(target).split('@')[0];
    await sock.sendMessage(remote, {
      text: formatSuccess(
        `Intercambio propuesto: tu #${offerId} por #${wantId} de @${tn}. Ellos usan /tradeaccept`
      ),
      mentions: [target],
    });
  },
};
