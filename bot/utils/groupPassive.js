import { query } from '../database/db.js';
import { xpPerMessage, levelFromTotalXp } from './profileXp.js';

const LINK_RE = /https?:\/\/|wa\.me\/|chat\.whatsapp\.com\//i;

/**
 * @param {string} groupJid
 * @param {string} userJid
 * @param {string} text
 * @param {{ antilink_enabled?: boolean }} gs
 * @returns {boolean} true si se debe borrar el mensaje
 */
export function shouldDeleteAntilink(gs, text) {
  if (!gs?.antilink_enabled) return false;
  return LINK_RE.test(text);
}

/**
 * Suma mensaje + XP de perfil (grupo).
 * @param {string} groupJid
 * @param {string} userJid
 */
export async function bumpProfileActivity(groupJid, userJid) {
  const addXp = xpPerMessage();
  const today = new Date().toISOString().slice(0, 10);

  await query(
    `INSERT INTO group_message_stats (group_jid, user_jid, stat_date, msg_count) VALUES (?, ?, ?, 1)
     ON CONFLICT (group_jid, user_jid, stat_date) DO UPDATE SET msg_count = group_message_stats.msg_count + 1`,
    [groupJid, userJid, today]
  );

  const rows = await query(
    `SELECT xp FROM group_profiles WHERE group_jid = ? AND user_jid = ? LIMIT 1`,
    [groupJid, userJid]
  );
  const xp = Number(rows[0]?.xp ?? 0) + addXp;
  const { level } = levelFromTotalXp(xp);

  await query(
    `INSERT INTO group_profiles (group_jid, user_jid, xp, level, total_messages)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT (group_jid, user_jid) DO UPDATE SET
       xp = EXCLUDED.xp,
       level = EXCLUDED.level,
       total_messages = group_profiles.total_messages + 1`,
    [groupJid, userJid, xp, level]
  );
}

/**
 * @param {string} groupJid
 * @param {string} userJid
 */
export async function bumpCommandCount(groupJid, userJid) {
  await query(
    `INSERT INTO group_profiles (group_jid, user_jid, total_commands) VALUES (?, ?, 1)
     ON CONFLICT (group_jid, user_jid) DO UPDATE SET total_commands = group_profiles.total_commands + 1`,
    [groupJid, userJid]
  );
}
