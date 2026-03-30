import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'divorce',
  aliases: [],
  description: 'Termina tu matrimonio en el grupo',
  category: 'Perfiles',
  usage: '/divorce',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const row = (
      await db.query(`SELECT partner_jid FROM group_profiles WHERE group_jid=? AND user_jid=?`, [
        remote,
        me,
      ])
    )[0];
    if (!row?.partner_jid) {
      await sock.sendMessage(remote, { text: formatError('No estás casado/a en este grupo.') });
      return;
    }
    const p = row.partner_jid;
    await db.query(`UPDATE group_profiles SET partner_jid = NULL WHERE group_jid=? AND user_jid=?`, [
      remote,
      me,
    ]);
    await db.query(`UPDATE group_profiles SET partner_jid = NULL WHERE group_jid=? AND user_jid=?`, [
      remote,
      p,
    ]);
    await sock.sendMessage(remote, {
      text: formatSuccess('Divorcio registrado. 💔'),
      mentions: [p],
    });
  },
};
