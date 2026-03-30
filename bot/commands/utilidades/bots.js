import { listInstances } from '../../utils/botRegistry.js';

export default {
  name: 'bots',
  aliases: ['sockets'],
  description: 'Instancias conectadas en este proceso',
  category: 'Utilidades',
  usage: '/bots',
  cooldown: 3,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const list = listInstances();
    if (!list.length) {
      await sock.sendMessage(remote, { text: 'No hay instancias registradas (reinicia el bot).' });
      return;
    }
    let t = `🤖 *Instancias activas:* ${list.length}\n\n`;
    for (const x of list) {
      const up = Math.floor((Date.now() - x.startedAt) / 1000);
      t += `• *${x.id}* — ${x.config?.name ?? '?'} · online ${up}s\n`;
    }
    await sock.sendMessage(remote, { text: t });
  },
};
