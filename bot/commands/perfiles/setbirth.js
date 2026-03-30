import { formatError, formatSuccess } from '../../utils/formatter.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'setbirth',
  aliases: [],
  description: 'Fecha de cumpleaños DD/MM/AAAA',
  category: 'Perfiles',
  usage: '/setbirth DD/MM/YYYY',
  cooldown: 5,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = actorJid(msg, remote);
    const raw = args[0];
    const m = String(raw ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) {
      await sock.sendMessage(remote, { text: formatError('Formato: /setbirth DD/MM/YYYY') });
      return;
    }
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    const iso = `${y}-${mo}-${d}`;
    const dt = new Date(iso + 'T12:00:00Z');
    if (Number.isNaN(dt.getTime())) {
      await sock.sendMessage(remote, { text: formatError('Fecha inválida.') });
      return;
    }
    await db.query(
      `INSERT INTO group_profiles (group_jid, user_jid, birth_date) VALUES (?, ?, CAST(? AS DATE))
       ON CONFLICT (group_jid, user_jid) DO UPDATE SET birth_date = EXCLUDED.birth_date`,
      [remote, user, iso]
    );
    await sock.sendMessage(remote, { text: formatSuccess(`Cumpleaños: ${d}/${mo}/${y}`) });
  },
};
