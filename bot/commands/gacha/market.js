import { formatError } from '../../utils/formatter.js';

export default {
  name: 'market',
  aliases: ['gachamarket', 'tiendawaifu'],
  description: 'Mercado de ventas del grupo',
  category: 'Gacha',
  usage: '/market',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const rows = await db.query(
      `SELECT m.id, m.price, m.seller_jid, m.character_id, gc.name, gc.series
       FROM gacha_market m
       JOIN gacha_characters gc ON gc.id = m.character_id
       WHERE m.group_jid = ? AND m.active = TRUE
       ORDER BY m.id DESC
       LIMIT 20`,
      [remote]
    );
    if (!rows.length) {
      return sock.sendMessage(remote, { text: 'El mercado está vacío. /sellwaifu <id_personaje> <precio>' });
    }
    let t = `🏪 *Mercado*\n\n`;
    rows.forEach((r) => {
      const sn = String(r.seller_jid).split('@')[0];
      t += `• #${r.id} · *${r.name}* (${r.series}) — ${r.price} coins · vendedor @${sn}\n`;
    });
    t += `\n_Compra con /buywaifu <id_listado>_`;
    await sock.sendMessage(remote, { text: t });
  },
};
