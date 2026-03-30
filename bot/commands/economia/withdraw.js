import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid, getMember } from '../../utils/economyHelpers.js';

export default {
  name: 'withdraw',
  aliases: ['with', 'retirar'],
  description: 'Saca monedas del banco a la cartera',
  category: 'Economía',
  usage: '/withdraw all|<cantidad>',
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
    const b = Number(row.bank);
    const raw = (args[0] ?? '').toLowerCase();
    let amt = raw === 'all' || raw === 'todo' ? b : parseInt(args[0] ?? '', 10);
    if (!Number.isFinite(amt) || amt < 1) {
      return sock.sendMessage(remote, { text: formatError('Uso: /withdraw 500 o /withdraw all') });
    }
    if (amt > b) amt = b;
    if (amt < 1) {
      return sock.sendMessage(remote, { text: formatError('Banco vacío.') });
    }
    await db.query(
      `UPDATE economy_members SET bank = bank - ?, wallet = wallet + ? WHERE group_jid = ? AND user_jid = ?`,
      [amt, amt, remote, me]
    );
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    await sock.sendMessage(remote, {
      text: formatSuccess(`Retiraste ${amt} ${coin} al bolsillo.`),
    });
  },
};
