import { getMentions, actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'warns',
  aliases: [],
  description: 'Lista warns de un usuario',
  category: 'Administración',
  usage: '/warns [@user]',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const men = getMentions(msg);
    const victim = men[0] ?? actorJid(msg, remote);
    const rows = await db.query(
      `SELECT id, reason, by_jid, created_at FROM group_warns WHERE group_jid = ? AND user_jid = ? ORDER BY id`,
      [remote, victim]
    );
    if (!rows.length) {
      return sock.sendMessage(remote, { text: 'Sin advertencias.' });
    }
    let t = `⚠️ *Warns* @${String(victim).split('@')[0]}\n\n`;
    rows.forEach((w) => {
      t += `#${w.id} · ${w.reason}\n`;
    });
    await sock.sendMessage(remote, { text: t, mentions: [victim] });
  },
};
