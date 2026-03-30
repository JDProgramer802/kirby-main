import {
  assertNsfwGroup,
  actorLabel,
  pickRandom,
  shortLabelFromJid,
  resolveMentionTarget,
} from '../../utils/nsfwHelpers.js';

const PHRASES_SOLO = [
  '*{a}* se encierra un rato y no quiere que nadie moleste.',
  '*{a}* baja la mirada y deja volar la imaginación.',
  '*{a}* acelera el ritmo hasta sudar frío.',
  '*{a}* suspira hondo… y suelta el móvil después.',
];

const PHRASES_PAIR = [
  '*{a}* no resiste y se masturba mirando a *{b}*.',
  '*{b}* observa sin pestañear mientras *{a}* se toca.',
  '*{a}* usa el recuerdo de *{b}* como combustible.',
  '*{a}* y *{b}* comparten un silencio muy elocuente.',
];

export default {
  name: 'fap',
  aliases: ['paja'],
  description: 'Hacerse una paja (mención opcional)',
  category: 'NSFW',
  usage: '/fap [@usuario]',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: true,
  async execute(sock, msg, _args, db, _config) {
    const ctx = await assertNsfwGroup(sock, msg, db);
    if (!ctx) return;
    const { remote } = ctx;
    const r = resolveMentionTarget(sock, msg, remote, false);
    const a = actorLabel(msg, remote);
    if (!r.target) {
      const text = pickRandom(PHRASES_SOLO).replaceAll('{a}', a);
      await sock.sendMessage(remote, { text: `🔞 ${text}`, mentions: [r.actor]});
      return;
    }
    const b = shortLabelFromJid(r.target);
    const text = pickRandom(PHRASES_PAIR).replaceAll('{a}', a).replaceAll('{b}', b);
    await sock.sendMessage(remote, {
      text: `🔞 ${text}`,
      mentions: [r.actor, r.target],
    });
  },
};
