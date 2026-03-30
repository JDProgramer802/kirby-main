import { formatError } from '../../utils/formatter.js';
import {
  fetchRandomCharacter,
  upsertGachaCharacterFromAnilist,
} from '../../utils/anilist.js';

export default {
  name: 'rollwaifu',
  aliases: ['rw', 'roll'],
  description: 'Saca un personaje aleatorio en vivo desde AniList',
  category: 'Gacha',
  usage: '/rollwaifu',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;

    await sock.sendMessage(remote, { text: '🎲 Consultando a AniList…' });

    try {
      const char = await fetchRandomCharacter();
      const dbId = await upsertGachaCharacterFromAnilist(db.query, char);

      const caption =
        `🎴 *¿Quién es este personaje?*\n\n` +
        `✨ *${char.name}*\n` +
        `📺 ${char.series}\n` +
        `💎 Rareza: *${char.rarity}* (★ ${char.favourites.toLocaleString()} favs en AniList)\n` +
        `💰 Valor base: ~${char.baseValue}\n\n` +
        `👉 Responde *citando este mensaje* con /claim para reclamarlo.\n` +
        `🔖 ref:db:${dbId}  ref:al:${char.anilistId}\n\n` +
        `_Datos en tiempo real: [AniList](https://anilist.co)_`;

      await sock.sendMessage(remote, {
        image: { url: char.imageUrl },
        caption,
      });
    } catch (e) {
      await sock.sendMessage(remote, {
        text: formatError(e instanceof Error ? e.message : 'Falló la tirada.'),
      });
    }
  },
};
