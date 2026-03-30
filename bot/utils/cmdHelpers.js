/** @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg */
export function getMentions(msg) {
  const ctx =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo;
  const m = ctx?.mentionedJid;
  return Array.isArray(m) ? m : [];
}

/** @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg */
export function quotedMessage(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ?? null;
}

/** @param {import('@itsukichan/baileys').proto.IWebMessageInfo} msg */
export function actorJid(msg, remote) {
  return msg.key.participant ?? remote;
}

/** @param {import('@itsukichan/baileys').proto.IMessage | null | undefined} q */
export function textFromQuoted(q) {
  if (!q) return '';
  return (
    q.conversation ||
    q.extendedTextMessage?.text ||
    q.imageMessage?.caption ||
    ''
  );
}

/** @param {string} code */
export function parseInviteCode(code) {
  const m = String(code).match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
  return m ? m[1] : String(code).trim();
}
