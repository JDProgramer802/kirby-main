import { levelFromTotalXp } from '../../utils/profileXp.js';

export default {
  name: 'leaderboard',
  aliases: ['lboard', 'top'],
  description: 'Top XP del grupo (paginado)',
  category: 'Perfiles',
  usage: '/leaderboard [página]',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const page = Math.max(1, parseInt(args[0] ?? '1', 10) || 1);
    const limit = 10;
    const off = (page - 1) * limit;
    const rows = await db.query(
      `SELECT user_jid, xp FROM group_profiles WHERE group_jid = ? ORDER BY xp DESC LIMIT ? OFFSET ?`,
      [remote, limit, off]
    );
    if (!rows.length) {
      await sock.sendMessage(remote, { text: 'Aún no hay XP en este grupo. ¡Escribe algo!' });
      return;
    }
    let out = `🏆 *Top XP* · página ${page}\n\n`;
    rows.forEach((r, i) => {
      const n = String(r.user_jid).split('@')[0];
      const { level } = levelFromTotalXp(Number(r.xp));
      out += `${off + i + 1}. @${n} — Lv.${level} · ${r.xp} XP\n`;
    });
    const mentions = rows.map((r) => r.user_jid);
    await sock.sendMessage(remote, { text: out, mentions });
  },
};
