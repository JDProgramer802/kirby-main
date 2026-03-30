import { formatSuccess } from '../../utils/formatter.js';
import { requireOwner } from '../../utils/ownerOnly.js';
import { reloadCommands } from '../../core/loader.js';

export default {
  name: 'reload',
  aliases: [],
  description: 'Recarga comandos desde disco',
  category: 'Subbots',
  usage: '/reload',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    await reloadCommands();
    await sock.sendMessage(remote, { text: formatSuccess('Comandos recargados.') });
  },
};
