import crypto from 'crypto';
import QRCode from 'qrcode';
import { requireOwner } from '../../utils/ownerOnly.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'qr',
  aliases: ['code'],
  description: 'Token + QR para registrar sub-bot (dueño)',
  category: 'Subbots',
  usage: '/qr',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, _args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const owner = actorJid(msg, remote);
    const token = crypto.randomBytes(18).toString('hex');
    const exp = new Date(Date.now() + 3600 * 1000).toISOString();
    await db.query(
      `INSERT INTO subbot_pairing_tokens (token, owner_jid, premium, temporal, expires_at) VALUES (?, ?, false, false, ?)`,
      [token, owner, exp]
    );
    const buf = await QRCode.toBuffer(token, { type: 'png', width: 280, margin: 2 });
    await sock.sendMessage(remote, {
      image: buf,
      caption:
        `🔐 *Token sub-bot* (1h)\n\`${token}\`\n\n` +
        `Añade otra entrada en SUBBOTS del servidor y usa este token en \`SUBBOT_REGISTER_TOKEN\` (flujo manual) o escanea el QR para copiar.`,
    });
  },
};
