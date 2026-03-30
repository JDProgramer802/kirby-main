import { formatError } from '../../utils/formatter.js';
import { getMentions, actorJid } from '../../utils/cmdHelpers.js';
import { levelFromTotalXp, progressBar } from '../../utils/profileXp.js';

export default {
  name: 'level',
  aliases: ['lvl'],
  description: 'Nivel y barra de XP',
  category: 'Perfiles',
  usage: '/level [@usuario]',
  cooldown: 2,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const men = getMentions(msg);
    const target = men[0] ?? me;
    await db.query(
      `INSERT INTO group_profiles (group_jid, user_jid) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [remote, target]
    );
    const p = (
      await db.query(`SELECT xp FROM group_profiles WHERE group_jid = ? AND user_jid = ?`, [remote, target])
    )[0];
    const xp = Number(p?.xp ?? 0);
    const { level, intoLevel, need } = levelFromTotalXp(xp);
    const ratio = need > 0 ? intoLevel / need : 0;
    const bar = progressBar(ratio, 14);
    const num = String(target).split('@')[0];
    await sock.sendMessage(remote, {
      text:
        `⚡ *Nivel ${level}* ${target === me ? '' : `(@${num})`}\n` +
        `${bar} *${intoLevel}* / *${need}* XP`,
      mentions: target !== me ? [target] : undefined,
    });
  },
};
