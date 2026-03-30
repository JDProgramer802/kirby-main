import { formatError } from '../../utils/formatter.js';
import {
  assertNsfwGroup,
  actorLabel,
  pickRandom,
  shortLabelFromJid,
  resolveMentionTarget,
} from '../../utils/nsfwHelpers.js';

const PHRASES = [
  '*{a}* atrapó a *{b}* entre su pecho hasta el límite.',
  '*{b}* no puede apartar la mirada mientras *{a}* frotá sin piedad.',
  '*{a}* aprieta y desliza; *{b}* jadea cada vez más fuerte.',
  '*{a}* dejó a *{b}* hecho gelatina con esa “rusa”.',
];

export default {
  name: 'boobjob',
  aliases: [],
  description: 'Hacer una rusa',
  category: 'NSFW',
  usage: '/boobjob @usuario',
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
