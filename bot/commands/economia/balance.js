import { formatError } from '../../utils/formatter.js';
import { getMember, getMentions, actorJid } from '../../utils/economyHelpers.js';

export default {
  name: 'balance',
  aliases: ['bal', 'coins'],
  description: 'Muestra monedas en cartera y banco',
  category: 'Economía',
  usage: '/balance [@usuario]',
  cooldown: 2,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const me = actorJid(msg, remote);
    let target = me;
    const men = getMentions(msg);
    if (men[0]) target = men[0];
    else if (args[0]) {
      await sock.sendMessage(remote, {
        text: formatError('Menciona a alguien con @ para ver su balance.'),
      });
      return;
    }
    const row = await getMember(db, remote, target);
    const num = String(target).split('@')[0];
    const label = target === me ? 'Tu' : `@${num}`;
    await sock.sendMessage(remote, {
      text:
        `💰 *${label} balance*\n` +
        `👛 Cartera: *${row.wallet}* coins\n` +
        `🏦 Banco: *${row.bank}* coins\n` +
        `📊 Total: *${BigInt(row.wallet) + BigInt(row.bank)}*`,
    });
  },
};
