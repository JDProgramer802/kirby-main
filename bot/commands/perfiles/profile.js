import { getMentions, actorJid } from '../../utils/cmdHelpers.js';
import { levelFromTotalXp } from '../../utils/profileXp.js';

export default {
  name: 'profile',
  aliases: [],
  description: 'Perfil completo (XP, monedas, bio, pareja, fav…)',
  category: 'Perfiles',
  usage: '/profile [@usuario]',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    let target = me;
    const men = getMentions(msg);
    if (men[0]) target = men[0];

    await db.query(
      `INSERT INTO group_profiles (group_jid, user_jid) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [remote, target]
    );
    const p = (
      await db.query(`SELECT * FROM group_profiles WHERE group_jid = ? AND user_jid = ?`, [remote, target])
    )[0];
    const eco = (
      await db.query(`SELECT wallet, bank FROM economy_members WHERE group_jid = ? AND user_jid = ?`, [
        remote,
        target,
      ])
    )[0];
    const gs = await db.getGroupSettings(remote);
    const coin = gs?.economy_currency ?? 'coins';
    const w = eco ? Number(eco.wallet) + Number(eco.bank) : 0;
    const { level, intoLevel, need } = levelFromTotalXp(p?.xp ?? 0);
    const num = String(target).split('@')[0];
    let partnerLine = 'Soltero/a';
    if (p?.partner_jid) {
      const pn = String(p.partner_jid).split('@')[0];
      partnerLine = `@${pn}`;
    }
    const txt =
      `📇 *Perfil* ${target === me ? '(tú)' : `@${num}`}\n` +
      `📊 Nivel *${level}* · XP *${intoLevel}/${need}*\n` +
      `💬 Mensajes: *${p?.total_messages ?? 0}* · Comandos: *${p?.total_commands ?? 0}*\n` +
      `💰 ${coin}: *${w}*\n` +
      `📝 Bio: _${p?.description || 'Sin descripción'}_\n` +
      `⚧ Género: ${p?.gender || '—'}\n` +
      `🎂 Cumple: ${p?.birth_date ? String(p.birth_date).slice(0, 10) : '—'}\n` +
      `💍 Pareja: ${partnerLine}\n` +
      `⭐ Favorito: ${p?.fav_char_name || '—'}`;
    await sock.sendMessage(remote, { text: txt, mentions: target !== me ? [target] : undefined });
  },
};
