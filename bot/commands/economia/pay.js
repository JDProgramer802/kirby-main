import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions, actorJid, getMember } from '../../utils/economyHelpers.js';

export default {
  name: 'pay',
  aliases: ['pagar', 'transfer'],
  description: 'Transfiere monedas de tu cartera',
  category: 'Economía',
  usage: '/pay @usuario cantidad',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const men = getMentions(msg);
    const to = men[0];
    const amt = parseInt(args.find((a) => /^\d+$/.test(a)) ?? '', 10);
    if (!to || to === me || !Number.isFinite(amt) || amt < 1) {
      return sock.sendMessage(remote, { text: formatError('Uso: /pay @usuario 100') });
    }
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    const row = await getMember(db, remote, me);
    if (Number(row.wallet) < amt) {
      return sock.sendMessage(remote, { text: formatError('No tienes suficiente en cartera.') });
    }
    await db.query(
      `UPDATE economy_members SET wallet = wallet - ? WHERE group_jid = ? AND user_jid = ?`,
      [amt, remote, me]
    );
    await db.query(
      `INSERT INTO economy_members (group_jid, user_jid, wallet) VALUES (?, ?, ?)
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET wallet = economy_members.wallet + ?`,
      [remote, to, amt, amt]
    );
    const n = String(to).split('@')[0];
    await sock.sendMessage(remote, {
      text: formatSuccess(`Enviaste ${amt} ${coin} a @${n}`),
      mentions: [to],
    });
  },
};
