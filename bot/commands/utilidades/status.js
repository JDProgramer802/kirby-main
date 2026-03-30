export default {
  name: 'status',
  aliases: [],
  description: 'Estado del proceso del bot',
  category: 'Utilidades',
  usage: '/status',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const mem = process.memoryUsage();
    const groups = Object.keys(sock.chats || {}).filter((k) => k.endsWith('@g.us')).length;
    const prof = await db.query(`SELECT COUNT(*)::int AS c FROM group_profiles`).catch(() => [{ c: 0 }]);
    const txt =
      `*Status*\n` +
      `⏱ Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n` +
      `🧠 RAM: ${Math.round(mem.heapUsed / 1048576)} MB\n` +
      `📗 Node: ${process.version}\n` +
      `💬 Chats grupo (cache): ${groups}\n` +
      `👤 Filas perfil (total): ${prof[0]?.c ?? '—'}`;
    await sock.sendMessage(remote, { text: txt });
  },
};
