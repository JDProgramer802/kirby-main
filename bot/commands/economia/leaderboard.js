export default {
  name: 'eleaderboard',
  aliases: ['erank', 'topcoins', 'economyleaderboard'],
  description: 'Top riqueza del grupo (cartera + banco)',
  category: 'Economía',
  usage: '/eleaderboard',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    const rows = await db.query(
      `SELECT user_jid, (wallet + bank) AS total FROM economy_members
       WHERE group_jid = ? ORDER BY total DESC LIMIT 12`,
      [remote]
    );
    if (!rows.length) {
      return sock.sendMessage(remote, { text: 'Sin datos de economía.' });
    }
    let t = `💎 *Top ${coin}*\n\n`;
    const mentions = [];
    rows.forEach((r, i) => {
      const j = String(r.user_jid);
      mentions.push(j);
      t += `${i + 1}. @${j.split('@')[0]} — *${r.total}*\n`;
    });
    await sock.sendMessage(remote, { text: t, mentions });
  },
};
