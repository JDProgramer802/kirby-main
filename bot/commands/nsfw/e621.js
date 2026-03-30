import { formatError } from '../../utils/formatter.js';
import { assertNsfwGroup } from '../../utils/nsfwHelpers.js';
import { randomE621Url } from '../../utils/booruClient.js';

export default {
  name: 'e621',
  aliases: [],
  description: 'Buscar en e621 (tags)',
  category: 'NSFW',
  usage: '/e621 tag1 tag2',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: true,
  async execute(sock, msg, args, db, _config) {
    const ctx = await assertNsfwGroup(sock, msg, db);
    if (!ctx) return;
    const tags = args.join(' ').trim() || 'order:random rating:explicit';
    try {
      const url = await randomE621Url(tags);
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
