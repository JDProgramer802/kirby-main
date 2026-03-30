export default {
  name: 'ping',
  aliases: ['p'],
  description: 'Latencia del bot',
  category: 'Utilidades',
  usage: '/ping',
  cooldown: 1,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const t0 = Date.now();
    await sock.sendMessage(remote, { text: '🏓 Pong…' });
    const ms = Date.now() - t0;
    await sock.sendMessage(remote, { text: `🏓 Pong · ~${ms} ms` });
  },
};
