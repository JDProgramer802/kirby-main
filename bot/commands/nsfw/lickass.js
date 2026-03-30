import { formatError } from '../../utils/formatter.js';
import {
  assertNsfwGroup,
  actorLabel,
  pickRandom,
  shortLabelFromJid,
  resolveMentionTarget,
} from '../../utils/nsfwHelpers.js';

const PHRASES = [
  '*{a}* lame despacio a *{b}* por detrás.',
  '*{b}* se agarra fuerte mientras *{a}* no para.',
  '*{a}* hunde la lengua en *{b}* sin vergüenza.',
  '*{b}* tiembla con cada lamida de *{a}*.',
];

export default {
  name: 'lickass',
  aliases: [],
  description: 'Lamer un culo',
  category: 'NSFW',
  usage: '/lickass @usuario',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: true,
  async execute(sock, msg, _args, db, _config) {
    const ctx = await assertNsfwGroup(sock, msg, db);
    if (!ctx) return;
    const { remote } = ctx;
    const r = resolveMentionTarget(sock, msg, remote, true);
    if (!r.ok || !r.target) {
      return sock.sendMessage(remote, { text: formatError('Menciona a alguien.') });
    }
    const a = actorLabel(msg, remote);
    const b = shortLabelFromJid(r.target);
    const text = pickRandom(PHRASES).replaceAll('{a}', a).replaceAll('{b}', b);
    await sock.sendMessage(remote, {
      text: `🔞 ${text}`,
      mentions: [r.actor, r.target],
    });
  },
};
