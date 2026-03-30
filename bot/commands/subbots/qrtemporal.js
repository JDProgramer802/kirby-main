import crypto from 'crypto';
import QRCode from 'qrcode';
import { requireOwner } from '../../utils/ownerOnly.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'qrtemporal',
  aliases: ['codetemporal'],
  description: 'QR token temporal (15 min)',
  category: 'Subbots',
  usage: '/qrtemporal',
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
    const token = crypto.randomBytes(12).toString('hex');
    const exp = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.query(
      `INSERT INTO subbot_pairing_tokens (token, owner_jid, premium, temporal, expires_at) VALUES (?, ?, false, true, ?)`,
      [token, owner, exp]
    );
    const buf = await QRCode.toBuffer(token, { type: 'png', width: 240 });
    await sock.sendMessage(remote, {
      image: buf,
      caption: `⏳ *Token temporal* (15 min)\n\`${token}\``,
    });
  },
};
