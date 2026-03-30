/**
 * Curva de nivel de perfil (mensajes). Configurable por env.
 * XP total acumulado → nivel. XP necesario del nivel L al L+1 = base * L^expPow
 */

function numEnv(k, d) {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v > 0 ? v : d;
}

export function xpForNextLevel(level) {
  const base = numEnv('PROFILE_XP_BASE', 100);
  const pow = numEnv('PROFILE_XP_LEVEL_POW', 1.35);
  return Math.floor(base * Math.pow(Math.max(1, level), pow));
}

export function totalXpForLevel(level) {
  let total = 0;
  for (let L = 1; L < level; L++) total += xpForNextLevel(L);
  return total;
}

export function levelFromTotalXp(totalXp) {
  let xp = Number(totalXp) || 0;
  let level = 1;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
    if (level > 9999) break;
  }
  return { level, intoLevel: xp, need: xpForNextLevel(level) };
}

export function xpPerMessage() {
  return Math.floor(numEnv('PROFILE_XP_PER_MESSAGE', 5));
}

/**
 * Barra de texto [████░░] 0-1
 * @param {number} ratio
 * @param {number} width
 */
export function progressBar(ratio, width = 12) {
  const r = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(r * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}
