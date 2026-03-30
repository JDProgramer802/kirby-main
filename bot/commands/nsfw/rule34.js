import { formatError } from '../../utils/formatter.js';
import { assertNsfwGroup } from '../../utils/nsfwHelpers.js';
import { randomRule34Url } from '../../utils/booruClient.js';

export default {
  name: 'rule34',
  aliases: ['r34'],
  description: 'Buscar en Rule34 (tags)',
  category: 'NSFW',
  usage: '/rule34 tag1 tag2',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: true,
  async execute(sock, msg, args, db, _config) {
    const ctx = await assertNsfwGroup(sock, msg, db);
    if (!ctx) return;
    const tags = args.join(' ').trim() || 'sort:random';
    try {
      const url = await randomRule34Url(tags);
      const lower = url.toLowerCase();
      if (lower.endsWith('.webm') || lower.endsWith('.mp4')) {
        await sock.sendMessage(ctx.remote, { video: { url } });
      } else {
        await sock.sendMessage(ctx.remote, { image: { url } });
      }
    } catch (e) {
      await sock.sendMessage(ctx.remote, {
        text: formatError(e instanceof Error ? e.message : 'Sin resultados o API caída.'),
      });
    }
  },
};
