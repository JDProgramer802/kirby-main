import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid, cooldownLeftSec, setCooldown, fmtDur } from '../../utils/economyHelpers.js';

const CD_KIND = 'daily';
const CD_SEC = 86_400;

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
  name: 'daily',
  aliases: ['diario'],
  description: 'Recompensa diaria',
  category: 'Economía',
  usage: '/daily',
  cooldown: 2,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const left = await cooldownLeftSec(db, remote, me, CD_KIND);
    if (left > 0) {
      return sock.sendMessage(remote, {
        text: formatError(`Vuelve en ${fmtDur(left)}.`),
      });
    }
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    const gain = rnd(120, 520);
    await db.query(
      `INSERT INTO economy_members (group_jid, user_jid, wallet) VALUES (?, ?, ?)
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET wallet = economy_members.wallet + ?`,
      [remote, me, gain, gain]
    );
    await setCooldown(db, remote, me, CD_KIND, CD_SEC);
    await sock.sendMessage(remote, {
      text: formatSuccess(`+${gain} ${coin} · vuelve mañana.`),
    });
  },
};
