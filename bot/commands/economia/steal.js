import { formatError, formatSuccess } from '../../utils/formatter.js';
import {
  getMentions,
  actorJid,
  getMember,
  cooldownLeftSec,
  setCooldown,
} from '../../utils/economyHelpers.js';

const CD_KIND = 'steal';
const CD_SEC = 7200;

export default {
  name: 'steal',
  aliases: ['robar'],
  description: 'Intenta robar cartera a otro usuario',
  category: 'Economía',
  usage: '/steal @usuario',
  cooldown: 2,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    const men = getMentions(msg);
    const victim = men[0];
    if (!victim || victim === me) {
      return sock.sendMessage(remote, { text: formatError('Menciona a tu víctima.') });
    }
    const left = await cooldownLeftSec(db, remote, me, CD_KIND);
    if (left > 0) {
      return sock.sendMessage(remote, { text: formatError(`Cooldown robo: ${left}s`) });
    }
    const gs = await db.getGroupSettings(remote);
    const coin = gs.economy_currency ?? 'coins';
    const vRow = await getMember(db, remote, victim);
    const vw = Number(vRow.wallet);
    if (vw < 20) {
      return sock.sendMessage(remote, { text: formatError('No tiene nada que robar.') });
    }
    await setCooldown(db, remote, me, CD_KIND, CD_SEC);
    const ok = Math.random() < 0.45;
    if (!ok) {
      const fine = Math.min(80, Math.floor(vw * 0.05) + 10);
      await db.query(
        `UPDATE economy_members SET wallet = GREATEST(0, wallet - ?), stat_steal = stat_steal + 1 WHERE group_jid = ? AND user_jid = ?`,
        [fine, remote, me]
      );
      return sock.sendMessage(remote, {
        text: formatError(`Te pillaron. Multa -${fine} ${coin}.`),
      });
    }
    const take = Math.min(vw, Math.floor(vw * (0.12 + Math.random() * 0.2)) + 15);
    await db.query(
      `UPDATE economy_members SET wallet = wallet - ? WHERE group_jid = ? AND user_jid = ?`,
      [take, remote, victim]
    );
    await db.query(
      `UPDATE economy_members SET wallet = wallet + ?, stat_steal = stat_steal + 1 WHERE group_jid = ? AND user_jid = ?`,
      [take, remote, me]
    );
    const n = String(victim).split('@')[0];
    await sock.sendMessage(remote, {
      text: formatSuccess(`Robaste ${take} ${coin} a @${n}`),
      mentions: [victim],
    });
  },
};
