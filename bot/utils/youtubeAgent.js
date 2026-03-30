import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botRoot = path.join(__dirname, '..');

/**
 * @param {string} domain
 */
function isYoutubeRelatedDomain(domain) {
  const d = domain.toLowerCase();
  return (
    d.includes('youtube') ||
    d.includes('googlevideo') ||
    d.includes('youtu.be') ||
    d === '.google.com' ||
    d.endsWith('.google.com') ||
    d.includes('.google.com.') ||
    d === 'google.com' ||
    d === 'accounts.google.com' ||
    d.endsWith('accounts.google.com')
  );
}

/**
 * Parsea formato Netscape (cookies.txt de navegador / yt-dlp) y devuelve objetos
 * compatibles con `ytdl.createAgent()` (@distube/ytdl-core).
 * Solo incluye dominios relacionados con YouTube / Google login.
 *
 * @param {string} raw
 * @returns {Array<Record<string, unknown>>}
 */
export function parseNetscapeCookiesForYoutube(raw) {
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('\t');
    if (parts.length < 7) continue;
    const domain = parts[0];
    const pathStr = parts[2];
    const secure = parts[3] === 'TRUE';
    const expRaw = parts[4];
    const name = parts[5];
    const value = parts.slice(6).join('\t');
    if (!name || !isYoutubeRelatedDomain(domain)) continue;

    const expSec = parseInt(expRaw, 10);
    const session = !Number.isFinite(expSec) || expSec === 0;

    /** @type {Record<string, unknown>} */
    const c = {
      domain: domain.startsWith('.') ? domain : domain,
      hostOnly: !domain.startsWith('.'),
      httpOnly: false,
      name,
      path: pathStr || '/',
      sameSite: 'no_restriction',
      secure,
      session,
      value,
    };
    if (!session) {
      c.expirationDate = expSec;
    }
    out.push(c);
  }
  return out;
}

/**
 * Ruta al archivo de cookies: `YT_COOKIES_PATH` o `bot/cookies.txt`.
 */
export function resolveYoutubeCookiesPath() {
  const explicit = process.env.YT_COOKIES_PATH?.trim();
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.join(botRoot, explicit);
  }
  return path.join(botRoot, 'cookies.txt');
}

let cachePath = '';
let cacheMtime = 0;
let cachedAgent = null;

/**
 * Crea (o reutiliza) el agente con cookies si existe `cookies.txt` y hay cookies parseables.
 *
 * @param {import('@distube/ytdl-core').default} ytdl
 */
export function getYtdlAgent(ytdl) {
  const p = resolveYoutubeCookiesPath();
  let st;
  try {
    st = fs.statSync(p);
  } catch {
    cachePath = '';
    cacheMtime = 0;
    cachedAgent = null;
    return undefined;
  }

  if (cachedAgent && cachePath === p && st.mtimeMs === cacheMtime) {
    return cachedAgent;
  }

  const raw = fs.readFileSync(p, 'utf8');
  const cookies = parseNetscapeCookiesForYoutube(raw);
  if (!cookies.length) {
    console.warn(
      '[youtube] cookies.txt sin cookies de YouTube/Google; exporta de nuevo desde el navegador (youtube.com).'
    );
    cachedAgent = null;
    cachePath = p;
    cacheMtime = st.mtimeMs;
    return undefined;
  }

  cachedAgent = ytdl.createAgent(cookies);
  cachePath = p;
  cacheMtime = st.mtimeMs;
  return cachedAgent;
}
