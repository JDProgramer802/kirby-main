import { listInstances } from '../../utils/botRegistry.js';

export default {
  name: 'botinfo',
  aliases: ['infobot'],
  description: 'Datos de esta instancia',
  category: 'Subbots',
  usage: '/botinfo',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const inst = listInstances().find((x) => x.id === db.instanceId);
    const up = inst ? Math.floor((Date.now() - inst.startedAt) / 1000) : 0;
    const gr = Object.keys(sock.chats || {}).filter((k) => k.endsWith('@g.us')).length;
    const bi = (
      await db.query(`SELECT * FROM bot_instances WHERE instance_id = ? LIMIT 1`, [db.instanceId ?? 'main'])
    )[0];
    const txt =
      `🤖 *Instancia:* ${db.instanceId ?? 'main'}\n` +
      `📛 Nombre: ${config.name}\n` +
      `⌨️ Prefijo: \`${config.prefix}\`\n` +
      `👑 Dueño: ${config.ownerNumbers?.[0] ?? '—'}\n` +
      `💬 Grupos (cache): ${gr}\n` +
      `⏱ Uptime sesión: ${up}s\n` +
      `📦 Node: ${process.version}\n` +
      `💰 Moneda (DB): ${bi?.currency_name ?? 'coins'}`;
    await sock.sendMessage(remote, { text: txt });
  },
};
