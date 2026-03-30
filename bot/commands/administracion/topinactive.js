export default {
  name: 'topinactive',
  aliases: ['topinactivos', 'menosactivos'],
  description: 'Miembros con menos mensajes en el periodo (entre los que tienen stats)',
  category: 'Administración',
  usage: '/topinactive [días]',
  cooldown: 10,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    let days = 7;
    const n = parseInt(args[0] ?? '', 10);
    if (Number.isFinite(n) && n > 0 && n <= 365) days = n;

    const rows = await db.query(
      `SELECT user_jid, SUM(msg_count)::bigint AS total
       FROM group_message_stats
       WHERE group_jid = ? AND stat_date >= (CURRENT_DATE - (?::integer))
       GROUP BY user_jid
       ORDER BY total ASC
       LIMIT 15`,
      [remote, days]
    );
    if (!rows.length) {
      return sock.sendMessage(remote, { text: 'Sin datos de mensajes en ese periodo.' });
    }
    let t = `💤 *Menos activos* (${days}d)\n\n`;
    const mentions = [];
    rows.forEach((r, i) => {
      const j = String(r.user_jid);
      mentions.push(j);
      t += `${i + 1}. @${j.split('@')[0]} — *${r.total}*\n`;
    });
    await sock.sendMessage(remote, { text: t, mentions });
  },
};
