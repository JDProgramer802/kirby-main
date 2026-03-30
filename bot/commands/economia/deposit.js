import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid, getMember } from '../../utils/economyHelpers.js';

export default {
  name: 'deposit',
  aliases: ['dep', 'ingresar'],
  description: 'Pasa monedas de cartera al banco',
  category: 'Economía',
  usage: '/deposit all|<cantidad>',
  cooldown: 2,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const row = await getMember(db, remote, me);
    const w = Number(row.wallet);
    const raw = (args[0] ?? 'all').toLowerCase();
    let amt = raw === 'all' || raw === 'todo' ? w : parseInt(raw, 10);
    if (!Number.isFinite(amt) || amt < 1) {
      return sock.sendMessage(remote, { text: formatError('Uso: /deposit 500 o /deposit all') });
    }
    if (amt > w) amt = w;
    if (amt < 1) {
      return sock.sendMessage(remote, { text: formatError('Cartera vacía.') });
    }
    await db.query(
      `UPDATE economy_members SET wallet = wallet - ?, bank = bank + ? WHERE group_jid = ? AND user_jid = ?`,
      [amt, amt, remote, me]
    );
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    await sock.sendMessage(remote, {
      text: formatSuccess(`Ingresaste ${amt} ${coin} al banco.`),
    });
  },
};
