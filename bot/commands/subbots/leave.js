import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';
import { getPermissionLevel, PermissionLevel } from '../../utils/permissions.js';

export default {
  name: 'leave',
  aliases: ['salir'],
  description: 'El bot sale del grupo',
  category: 'Subbots',
  usage: '/leave',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const lvl = await getPermissionLevel(sock, msg, config);
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok && lvl !== PermissionLevel.GROUP_ADMIN) {
      return sock.sendMessage(remote, { text: formatError('Solo dueño del bot o admin del grupo.') });
    }
    try {
      await sock.groupLeave(remote);
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
