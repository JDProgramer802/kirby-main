import { getMentions, actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'msgcount',
  aliases: ['mensajes', 'contarmensajes'],
  description: 'Mensajes registrados en los últimos N días (stats diarias)',
  category: 'Administración',
  usage: '/msgcount [días] [@user]',
  cooldown: 5,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;

    let days = 7;
    let argStart = 0;
    const first = parseInt(args[0] ?? '', 10);
    if (Number.isFinite(first) && first > 0 && first <= 365) {
      days = first;
      argStart = 1;
    }
    const men = getMentions(msg);
    const userJid = men[0] ?? actorJid(msg, remote);

    const rows = await db.query(
      `SELECT COALESCE(SUM(msg_count), 0)::bigint AS total
       FROM group_message_stats
       WHERE group_jid = ? AND user_jid = ?
         AND stat_date >= (CURRENT_DATE - (?::integer))`,
      [remote, userJid, days]
    );
    const total = Number(rows[0]?.total ?? 0);
    const num = String(userJid).split('@')[0];
    await sock.sendMessage(remote, {
      text: `📊 *Mensajes* @${num} · últimos *${days}* días: *${total}*`,
      mentions: [userJid],
    });
  },
};
