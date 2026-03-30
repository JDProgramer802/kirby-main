import { formatError, formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';
import { parseInviteCode } from '../../utils/cmdHelpers.js';

export default {
  name: 'join',
  aliases: [],
  description: 'Unir el bot a un grupo por enlace',
  category: 'Subbots',
  usage: '/join enlace',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const code = parseInviteCode(args.join(' ') || '');
    if (!code) return sock.sendMessage(remote, { text: formatError('Pasa un enlace válido.') });
    try {
      await sock.groupAcceptInvite(code);
      await sock.sendMessage(remote, { text: formatSuccess('Solicitud de unión enviada.') });
    } catch (e) {
      await sock.sendMessage(remote, { text: formatError(e instanceof Error ? e.message : 'x') });
    }
  },
};
