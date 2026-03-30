import crypto from 'crypto';
import QRCode from 'qrcode';
import { requireOwner } from '../../utils/ownerOnly.js';
import { actorJid } from '../../utils/cmdHelpers.js';

export default {
  name: 'qrpremium',
  aliases: ['codepremium'],
  description: 'QR token premium para sub-bot',
  category: 'Subbots',
  usage: '/qrpremium <token_premium>',
  cooldown: 10,
  adminOnly: false,
  ownerOnly: true,
  groupOnly: false,
  nsfw: false,
  async execute(sock, msg, args, db, config) {
    const remote = msg.key.remoteJid;
    if (!remote) return;
    const r = requireOwner(sock, msg, remote, config.ownerNumbers);
    if (!r.ok) return sock.sendMessage(remote, { text: r.text });
    const prem = args[0];
    if (!prem || prem !== process.env.SUBBOT_PREMIUM_SECRET) {
      return sock.sendMessage(remote, { text: 'Token premium inválido.' });
    }
    const owner = actorJid(msg, remote);
    const token = crypto.randomBytes(18).toString('hex');
    const exp = new Date(Date.now() + 7200 * 1000).toISOString();
    await db.query(
      `INSERT INTO subbot_pairing_tokens (token, owner_jid, premium, temporal, expires_at) VALUES (?, ?, true, false, ?)`,
      [token, owner, exp]
    );
    const buf = await QRCode.toBuffer(token, { type: 'png', width: 280 });
    await sock.sendMessage(remote, {
      image: buf,
      caption: `⭐ *Sub-bot premium*\n\`${token}\``,
    });
  },
};
