import { formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'delgenre',
  aliases: [],
  description: 'Quita el género del perfil',
  category: 'Perfiles',
  usage: '/delgenre',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    await db.query(
      `INSERT INTO group_profiles (group_jid, user_jid) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [remote, user]
    );
    await db.query(`UPDATE group_profiles SET gender = NULL WHERE group_jid = ? AND user_jid = ?`, [
      remote,
      user,
    ]);
    await sock.sendMessage(remote, { text: formatSuccess('Género eliminado.') });
  },
};
