import { formatError } from '../../utils/formatter.js';
import {
  assertNsfwGroup,
  actorLabel,
  pickRandom,
  shortLabelFromJid,
  resolveMentionTarget,
} from '../../utils/nsfwHelpers.js';

const PHRASES = [
  '*{a}* se arrodilla frente a *{b}* y no deja escapar nada.',
  '*{b}* enreda los dedos en el cabello de *{a}* sin soltar.',
  '*{a}* usa la lengua hasta que *{b}* pierde la razón.',
  '*{a}* mira a *{b}* a los ojos mientras termina el trabajo.',
];

export default {
  name: 'blowjob',
  aliases: ['mamada', 'bj'],
  description: 'Dar una mamada',
  category: 'NSFW',
  usage: '/blowjob @usuario',
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
