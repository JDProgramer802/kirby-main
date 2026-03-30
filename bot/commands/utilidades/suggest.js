import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';
export default {
  name: 'suggest',
  aliases: ['add', 'addanime', 'report'],
  description: 'Sugerencia al dueño del bot (gacha / datos)',
  category: 'Utilidades',
  usage: '/suggest texto',
  cooldown: 30,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const body = args.join(' ').trim();
    if (!body || body.length > 800) {
      await sock.sendMessage(remote, { text: formatError('Escribe tu sugerencia (máx. 800).') });
      return;
    }
    const from = actorJid(msg, remote);
    await db.query(`INSERT INTO suggestions (from_jid, body) VALUES (?, ?)`, [from, body]);
    await sock.sendMessage(remote, { text: formatSuccess('Sugerencia enviada al staff. ¡Gracias!') });
    const owner = config.ownerNumbers?.[0];
    if (owner) {
      try {
        await sock.sendMessage(owner, {
          text: `📩 *Sugerencia*\nDe: ${from}\n\n${body}`,
        });
      } catch {
        /* DM cerrado */
      }
    }
  },
};
