import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid, cooldownLeftSec, setCooldown } from '../../utils/economyHelpers.js';

const CD_KIND = 'work';
const CD_SEC = 3600;

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
  name: 'work',
  aliases: ['trabajar'],
  description: 'Trabaja por monedas',
  category: 'Economía',
  usage: '/work',
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
      return sock.sendMessage(remote, { text: formatError(`Cooldown: ${left}s`) });
    }
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    const gain = rnd(40, 180);
    await db.query(
      `INSERT INTO economy_members (group_jid, user_jid, wallet, stat_work) VALUES (?, ?, ?, 1)
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET
         wallet = economy_members.wallet + ?,
         stat_work = economy_members.stat_work + 1`,
      [remote, me, gain, gain]
    );
    await setCooldown(db, remote, me, CD_KIND, CD_SEC);
    await sock.sendMessage(remote, {
      text: formatSuccess(`Trabajaste y ganaste +${gain} ${coin}.`),
    });
  },
};
