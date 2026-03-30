import { formatError, formatSuccess } from '../../utils/formatter.js';

export default {
  name: 'open',
  aliases: [],
  description: 'Grupo abierto (todos escriben)',
  category: 'Administración',
  usage: '/open',
  cooldown: 5,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    try {
      await sock.groupSettingUpdate(remote, 'not_announcement');
      await sock.sendMessage(remote, { text: formatSuccess('Grupo abierto.') });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
