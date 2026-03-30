import { formatError } from '../../utils/formatter.js';
import {
  assertNsfwGroup,
  actorLabel,
  pickRandom,
  shortLabelFromJid,
  resolveMentionTarget,
} from '../../utils/nsfwHelpers.js';

const PHRASES = [
  '*{a}* y *{b}* se enredan en un 69 que no termina nunca.',
  '*{a}* y *{b}* se buscan la boca al mismo tiempo.',
  'El mundo desaparece: solo *{a}* y *{b}* y ese ángulo perfecto.',
  '*{b}* y *{a}* compiten por ver quién gime primero.',
];

export default {
  name: 'sixnine',
  aliases: ['69'],
  description: 'Hacer un 69',
  category: 'NSFW',
  usage: '/sixnine @usuario',
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
