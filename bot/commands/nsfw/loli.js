import { formatError } from '../../utils/formatter.js';
import { assertNsfwGroup } from '../../utils/nsfwHelpers.js';
import { randomGelbooruUrl } from '../../utils/booruClient.js';

export default {
  name: 'loli',
  aliases: [],
  description: 'Imagen aleatoria (tag loli; puede no dar resultados)',
  category: 'NSFW',
  usage: '/loli',
  cooldown: 8,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: true,
  async execute(sock, msg, _args, db, _config) {
    const ctx = await assertNsfwGroup(sock, msg, db);
    if (!ctx) return;
    try {
      const url = await randomGelbooruUrl('loli rating:explicit sort:random');
      await sock.sendMessage(ctx.remote, { image: { url } });
    } catch (e) {
      await sock.sendMessage(ctx.remote, {
        text: formatError(e instanceof Error ? e.message : 'Sin resultados o API caída.'),
      });
    }
  },
};
