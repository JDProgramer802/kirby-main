function nextBirthdayThisYear(month, day, from) {
  const y = from.getFullYear();
  let d = new Date(y, month - 1, day);
  if (d < from) d = new Date(y + 1, month - 1, day);
  return d;
}

export default {
  name: 'birthdays',
  aliases: ['cumpleanos', 'births'],
  description: 'Cumpleaños en los próximos 30 días',
  category: 'Perfiles',
  usage: '/birthdays',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const rows = await db.query(
      `SELECT user_jid, birth_date FROM group_profiles WHERE group_jid = ? AND birth_date IS NOT NULL`,
      [remote]
    );
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 30);
    const list = [];
    for (const r of rows) {
      const bd = new Date(r.birth_date);
      const m = bd.getUTCMonth() + 1;
      const d = bd.getUTCDate();
      const next = nextBirthdayThisYear(m, d, now);
      if (next <= horizon) {
        list.push({ user_jid: r.user_jid, next });
      }
    }
    list.sort((a, b) => a.next - b.next);
    if (!list.length) {
      await sock.sendMessage(remote, { text: '🎂 No hay cumpleaños en los próximos 30 días.' });
      return;
    }
    let t = '🎂 *Próximos cumpleaños*\n\n';
    const mentions = [];
    for (const x of list) {
      const n = String(x.user_jid).split('@')[0];
      t += `• @${n} — ${x.next.toLocaleDateString('es')}\n`;
      mentions.push(x.user_jid);
    }
    await sock.sendMessage(remote, { text: t, mentions });
  },
};
