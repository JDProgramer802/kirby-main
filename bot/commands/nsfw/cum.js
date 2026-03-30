import { formatError } from '../../utils/formatter.js';
import {
  assertNsfwGroup,
  actorLabel,
  pickRandom,
  shortLabelFromJid,
  resolveMentionTarget,
} from '../../utils/nsfwHelpers.js';

const PHRASES = [
  '*{a}* no aguantó más y cubrió a *{b}* por completo.',
  '*{b}* recibe todo lo que *{a}* guardaba.',
  '*{a}* deja marca en la piel de *{b}*… literalmente.',
  '*{a}* y *{b}* quedan pegados y sin aliento.',
];

export default {
  name: 'cum',
  aliases: [],
  description: 'Venirse en alguien',
  category: 'NSFW',
  usage: '/cum @usuario',
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
