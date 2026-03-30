import { formatError } from '../../utils/formatter.js';

export default {
  name: 'gp',
  aliases: ['group'],
  description: 'Información del grupo',
  category: 'Perfiles',
  usage: '/gp',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const meta = await sock.groupMetadata(remote).catch(() => null);
    if (!meta) {
      await sock.sendMessage(remote, { text: formatError('No pude leer los metadatos del grupo.') });
      return;
    }
    const admins = meta.participants.filter((p) => p.admin).length;
    const t =
      `📣 *${meta.subject}*\n` +
      `🆔 \`${remote}\`\n` +
      `👥 Miembros: *${meta.participants.length}*\n` +
      `🛡️ Admins: *${admins}*\n` +
      `📅 Creado: ${meta.creation ? new Date(meta.creation * 1000).toLocaleString('es') : '—'}\n` +
      `📝 Desc: _${meta.desc || 'Sin descripción'}_`;
    await sock.sendMessage(remote, { text: t });
  },
};
