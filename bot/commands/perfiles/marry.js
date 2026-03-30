import { formatError, formatSuccess } from '../../utils/formatter.js';
import { getMentions, actorJid } from '../../utils/cmdHelpers.js';
async function inGroup(sock, gid, jid) {
  try {
    const meta = await sock.groupMetadata(gid);
    return meta.participants.some((p) => p.id === jid);
  } catch {
    return false;
  }
}

export default {
  name: 'marry',
  aliases: ['casarse'],
  description: 'Propuesta o /marry accept @quien',
  category: 'Perfiles',
  usage: '/marry @user | /marry accept @proposer',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);

    if ((args[0] ?? '').toLowerCase() === 'accept') {
      const men = getMentions(msg);
      const proposer = men[0];
      if (!proposer) {
        await sock.sendMessage(remote, { text: formatError('Usa /marry accept @usuario') });
        return;
      }
      const pend = await db.query(
        `SELECT id FROM marriage_proposals WHERE group_jid = ? AND proposer_jid = ? AND target_jid = ?`,
        [remote, proposer, me]
      );
      if (!pend[0]) {
        await sock.sendMessage(remote, { text: formatError('No tienes una propuesta pendiente de esa persona.') });
        return;
      }
      await db.query(`DELETE FROM marriage_proposals WHERE id = ?`, [pend[0].id]);
      await db.query(
        `INSERT INTO group_profiles (group_jid, user_jid, partner_jid) VALUES (?, ?, ?)
         ON CONFLICT (group_jid, user_jid) DO UPDATE SET partner_jid = EXCLUDED.partner_jid`,
        [remote, me, proposer]
      );
      await db.query(
        `INSERT INTO group_profiles (group_jid, user_jid, partner_jid) VALUES (?, ?, ?)
         ON CONFLICT (group_jid, user_jid) DO UPDATE SET partner_jid = EXCLUDED.partner_jid`,
        [remote, proposer, me]
      );
      await sock.sendMessage(remote, {
        text: formatSuccess('💍 ¡Casados! El grupo celebra el amor verdadero.'),
        mentions: [me, proposer],
      });
      return;
    }

    const men = getMentions(msg);
    const target = men[0];
    if (!target || target === me) {
      await sock.sendMessage(remote, { text: formatError('Menciona a tu futura pareja.') });
      return;
    }
    if (!(await inGroup(sock, remote, target))) {
      await sock.sendMessage(remote, { text: formatError('Esa persona debe estar en el grupo.') });
      return;
    }
    const pMe = (await db.query(`SELECT partner_jid FROM group_profiles WHERE group_jid=? AND user_jid=?`, [remote, me]))[0];
    const pT = (await db.query(`SELECT partner_jid FROM group_profiles WHERE group_jid=? AND user_jid=?`, [remote, target]))[0];
    if (pMe?.partner_jid || pT?.partner_jid) {
      await sock.sendMessage(remote, { text: formatError('Uno de los dos ya está casado.') });
      return;
    }
    await db.query(
      `INSERT INTO marriage_proposals (group_jid, proposer_jid, target_jid) VALUES (?, ?, ?)
       ON CONFLICT (group_jid, proposer_jid, target_jid) DO NOTHING`,
      [remote, me, target]
    );
    await sock.sendMessage(remote, {
      text:
        `💌 *Propuesta de matrimonio*\n@${String(me).split('@')[0]} → @${String(target).split('@')[0]}\n\n` +
        `${target.split('@')[0]}, responde con: */marry accept @${String(me).split('@')[0]}*`,
      mentions: [me, target],
    });
  },
};
