import { formatError } from '../../utils/formatter.js';

export default {
  name: 'tag',
  aliases: ['hidetag', 'tagsay', 'tagall'],
  description: 'Menciona a todos',
  category: 'Administración',
  usage: '/tag mensaje',
  cooldown: 10,
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const text = args.join(' ').trim() || '🔔';
    const meta = await sock.groupMetadata(remote).catch(() => null);
    if (!meta) return sock.sendMessage(remote, { text: formatError('Sin metadata.') });
    const mentions = meta.participants.map((p) => p.id);
    await sock.sendMessage(remote, { text, mentions });
  },
};
