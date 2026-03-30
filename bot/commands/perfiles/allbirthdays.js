export default {
  name: 'allbirthdays',
  aliases: ['allbirths'],
  description: 'Todos los cumpleaños del grupo ordenados',
  category: 'Perfiles',
  usage: '/allbirthdays',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const rows = await db.query(
      `SELECT user_jid, birth_date FROM group_profiles
       WHERE group_jid = ? AND birth_date IS NOT NULL
       ORDER BY EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date)`,
      [remote]
    );
    if (!rows.length) {
      await sock.sendMessage(remote, { text: 'Nadie registró cumpleaños aún.' });
      return;
    }
    let t = '📅 *Cumpleaños del grupo*\n\n';
    const mentions = [];
    for (const r of rows) {
      const n = String(r.user_jid).split('@')[0];
      const ds = String(r.birth_date).slice(0, 10);
      t += `• @${n} — ${ds}\n`;
      mentions.push(r.user_jid);
    }
    await sock.sendMessage(remote, { text: t, mentions });
  },
};
