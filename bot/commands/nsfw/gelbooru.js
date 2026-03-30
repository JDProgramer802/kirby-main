import { formatError } from '../../utils/formatter.js';
import { assertNsfwGroup } from '../../utils/nsfwHelpers.js';
import { randomGelbooruUrl } from '../../utils/booruClient.js';

export default {
  name: 'gelbooru',
  aliases: ['gbooru', 'booru'],
  description: 'Buscar en Gelbooru (tags)',
  category: 'NSFW',
  usage: '/gelbooru tag1 tag2',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: true,
  async execute(sock, msg, args, db, _config) {
    const ctx = await assertNsfwGroup(sock, msg, db);
    if (!ctx) return;
    const tags = (args.join(' ').trim() || 'sort:random') + ' rating:explicit';
    try {
      const url = await randomGelbooruUrl(tags);
      await sock.sendMessage(ctx.remote, { image: { url } });
    } catch (e) {
      await sock.sendMessage(ctx.remote, {
        text: formatError(e instanceof Error ? e.message : 'Sin resultados o API caída.'),
      });
    }
  },
};
