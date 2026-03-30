import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions, actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'warn',
  aliases: [],
  description: 'Advertir usuario (auto-kick al límite)',
  category: 'Administración',
  usage: '/warn @user razón',
  cooldown: 3,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const men = getMentions(msg);
    const victim = men[0];
    if (!victim) return sock.sendMessage(remote, { text: formatError('Menciona al usuario.') });
    const reason = args.slice(1).join(' ').trim() || 'Sin razón';
    const by = actorJid(msg, remote);
    const gs = await db.getGroupSettings(remote);
    const limit = Number(gs.warn_limit ?? 3) || 3;
    await db.query(
      `INSERT INTO group_warns (group_jid, user_jid, reason, by_jid) VALUES (?, ?, ?, ?)`,
      [remote, victim, reason, by]
    );
    const cnt = (
      await db.query(`SELECT COUNT(*)::int AS c FROM group_warns WHERE group_jid = ? AND user_jid = ?`, [
        remote,
        victim,
      ])
    )[0]?.c ?? 0;
    let extra = '';
    if (cnt >= limit) {
      try {
        await sock.groupParticipantsUpdate(remote, [victim], 'remove');
        extra = '\n🚫 *Expulsado por límite de warns.*';
      } catch {
        extra = '\n(No se pudo expulsar automáticamente.)';
      }
    }
    await sock.sendMessage(remote, {
      text: formatSuccess(`Warn #${cnt}/${limit} · ${reason}${extra}`),
      mentions: [victim],
    });
  },
};
