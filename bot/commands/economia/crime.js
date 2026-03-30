import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid, cooldownLeftSec, setCooldown } from '../../utils/economyHelpers.js';

const CD_KIND = 'crime';
const CD_SEC = 5400;

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
  name: 'crime',
  aliases: ['crimen'],
  description: 'Actividad ilegal arriesgada',
  category: 'Economía',
  usage: '/crime',
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
    await setCooldown(db, remote, me, CD_KIND, CD_SEC);
    const win = Math.random() < 0.42;
    if (win) {
      const gain = rnd(90, 420);
      await db.query(
        `INSERT INTO economy_members (group_jid, user_jid, wallet, stat_crime) VALUES (?, ?, ?, 1)
         ON CONFLICT (group_jid, user_jid) DO UPDATE SET
           wallet = economy_members.wallet + ?,
           stat_crime = economy_members.stat_crime + 1`,
        [remote, me, gain, gain]
      );
      return sock.sendMessage(remote, {
        text: formatSuccess(`Salió bien. +${gain} ${coin}.`),
      });
    }
    const loss = rnd(50, 200);
    await db.query(
      `INSERT INTO economy_members (group_jid, user_jid, wallet, stat_crime) VALUES (?, ?, 0, 1)
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET
         wallet = GREATEST(0, economy_members.wallet - ?),
         stat_crime = economy_members.stat_crime + 1`,
      [remote, me, loss]
    );
    await sock.sendMessage(remote, {
      text: formatError(`Te atraparon. -${loss} ${coin}.`),
    });
  },
};
