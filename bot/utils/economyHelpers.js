/**
 * Helpers compartidos para comandos de economía (no son comandos).
 */

export function getMentions(msg) {
  const ctx =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo;
  const m = ctx?.mentionedJid;
  return Array.isArray(m) ? m : [];
}

export function actorJid(msg, remote) {
  return msg.key.participant ?? remote;
}

export async function ensureMember(db, groupJid, userJid) {
  await db.query(
    `INSERT INTO economy_members (group_jid, user_jid) VALUES (?, ?)
     ON CONFLICT (group_jid, user_jid) DO NOTHING`,
    [groupJid, userJid]
  );
}

export async function getMember(db, groupJid, userJid) {
  await ensureMember(db, groupJid, userJid);
  const r = await db.query(
    `SELECT * FROM economy_members WHERE group_jid = ? AND user_jid = ?`,
    [groupJid, userJid]
  );
  return r[0];
}

export async function cooldownLeftSec(db, groupJid, userJid, kind) {
  const r = await db.query(
    `SELECT until_ts FROM economy_cooldowns WHERE group_jid = ? AND user_jid = ? AND kind = ?`,
    [groupJid, userJid, kind]
  );
  if (!r[0]?.until_ts) return 0;
  const ms = new Date(r[0].until_ts).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

export async function setCooldown(db, groupJid, userJid, kind, secondsFromNow) {
  const until = new Date(Date.now() + secondsFromNow * 1000).toISOString();
  await db.query(
    `INSERT INTO economy_cooldowns (group_jid, user_jid, kind, until_ts) VALUES (?, ?, ?, ?)
     ON CONFLICT (group_jid, user_jid, kind) DO UPDATE SET until_ts = EXCLUDED.until_ts`,
    [groupJid, userJid, kind, until]
  );
}

export function fmtDur(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
