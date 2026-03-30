import { formatError, formatSuccess, applyTemplate } from '../../utils/formatter.js';

function quotedPlainText(q) {
  if (!q) return '';
  return (
    q.conversation ||
    q.extendedTextMessage?.text ||
    q.imageMessage?.caption ||
    q.videoMessage?.caption ||
    ''
  );
}

export default {
  name: 'claim',
  aliases: ['c', 'reclamar'],
  description: 'Reclama el personaje del mensaje citado (roll de AniList)',
  category: 'Gacha',
  usage: '/claim (cita el mensaje del roll)',
  cooldown: 2,
  adminOnly: false,
  ownerOnly: false,
  groupOnly: true,
  nsfw: false,
  async execute(sock, msg, _args, db, _config) {
    const remote = msg.key.remoteJid;
    if (!remote?.endsWith('@g.us')) return;
    const user = msg.key.participant ?? remote;

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      await sock.sendMessage(remote, {
        text: formatError('Cita el mensaje del bot que muestra el personaje y luego /claim'),
      });
      return;
    }

    const qtext = quotedPlainText(quoted);
    const m = qtext.match(/ref:db:(\d+)/);
    if (!m) {
      await sock.sendMessage(remote, {
        text: formatError('Ese mensaje no tiene un roll válido (falta ref:db).'),
      });
      return;
    }
    const characterId = Number(m[1]);
    if (!Number.isFinite(characterId)) {
      await sock.sendMessage(remote, { text: formatError('ID de personaje inválido.') });
      return;
    }

    const charRows = await db.query(
      `SELECT * FROM gacha_characters WHERE id = ? LIMIT 1`,
      [characterId]
    );
    const ch = charRows[0];
    if (!ch) {
      await sock.sendMessage(remote, { text: formatError('Personaje no encontrado en la base.') });
      return;
    }

    const taken = await db.query(
      `SELECT owner_jid FROM gacha_claims WHERE group_jid = ? AND character_id = ? LIMIT 1`,
      [remote, characterId]
    );
    if (taken[0]) {
      const ownerNum = String(taken[0].owner_jid).split('@')[0];
      await sock.sendMessage(remote, {
        text: formatError(`Ya fue reclamado por @${ownerNum}.`),
      });
      return;
    }

    await db.query(
      `INSERT INTO gacha_claims (group_jid, character_id, owner_jid) VALUES (?, ?, ?)`,
      [remote, characterId, user]
    );

    const meta = await db.query(
      `SELECT claim_message FROM gacha_user_meta WHERE group_jid = ? AND user_jid = ? LIMIT 1`,
      [remote, user]
    );
    const custom = meta[0]?.claim_message
      ? String(meta[0].claim_message)
      : '🎉 ¡{name} ahora es tuyo/a en este grupo! ({series})';

    const text = applyTemplate(custom, {
      user: String(user).split('@')[0],
      group: remote,
      tag: `@${String(user).split('@')[0]}`,
      name: String(ch.name),
      series: String(ch.series),
    });

    await sock.sendMessage(remote, {
      text: formatSuccess(text),
      mentions: [user],
    });
  },
};
