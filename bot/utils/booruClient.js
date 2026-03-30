/**
 * Cliente ligero para boorus (sin guardar archivos: solo URL → WA).
 * Respeta rate limits básicos con reintentos y backoff.
 */

const UA = 'KirbyBot/1.0 (+https://github.com)';

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {string} url
 * @param {number} attempt
 */
async function fetchJson(url, attempt = 0, headers = {}) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/json', ...headers },
  });
  if (res.status === 429 && attempt < 4) {
    await sleep(800 * (attempt + 1));
    return fetchJson(url, attempt + 1, headers);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * @param {string} tags
 */
function gelbooru(tags) {
  const t = encodeURIComponent((tags || '').trim() || 'sort:random');
  return `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&limit=100&tags=${t}`;
}

/**
 * @param {string} tags
 */
function rule34(tags) {
  const t = encodeURIComponent((tags || '').trim() || 'sort:random');
  return `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=100&tags=${t}`;
}

/**
 * @param {string} tags
 */
function danbooru(tags) {
  const t = encodeURIComponent((tags || '').trim() || 'order:random');
  return `https://danbooru.donmai.us/posts.json?tags=${t}&limit=20&random=true`;
}

/**
 * @param {string} tags
 */
function e621(tags) {
  const t = encodeURIComponent((tags || '').trim() || 'order:random');
  return `https://e621.net/posts.json?tags=${t}&limit=1`;
}

/**
 * @param {string} url
 */
function pickGelbooruPost(json) {
  const posts = json?.post;
  if (posts == null) return null;
  const list = Array.isArray(posts) ? posts : [posts];
  const valid = list.filter(
    (p) => p && (p.file_url || p.sample_url || p.preview_url) && Number(p.width) > 0
  );
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * @param {string} url
 */
function pickRule34Post(json) {
  const posts = json?.post;
  if (posts == null) return null;
  const list = Array.isArray(posts) ? posts : [posts];
  const valid = list.filter((p) => p?.file_url);
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * @param {unknown[]} arr
 */
function pickDanbooru(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  const valid = arr.filter((p) => p?.file_url);
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * @param {unknown[]} posts
 */
function pickE621(posts) {
  if (!Array.isArray(posts) || !posts.length) return null;
  const valid = posts.filter((p) => p?.file && (p.file.url || p.file.sample?.url));
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * @param {string} tags
 */
export async function randomGelbooruUrl(tags) {
  const j = await fetchJson(gelbooru(tags));
  const p = pickGelbooruPost(j);
  if (!p) throw new Error('Sin resultados en Gelbooru.');
  return String(p.file_url || p.sample_url || p.preview_url);
}

/**
 * @param {string} tags
 */
export async function randomRule34Url(tags) {
  const j = await fetchJson(rule34(tags));
  const p = pickRule34Post(j);
  if (!p) throw new Error('Sin resultados en Rule34.');
  return String(p.file_url);
}

/**
 * @param {string} tags
 */
export async function randomDanbooruUrl(tags) {
  const j = await fetchJson(danbooru(tags));
  const p = pickDanbooru(Array.isArray(j) ? j : []);
  if (!p) throw new Error('Sin resultados en Danbooru.');
  return String(p.file_url);
}

/**
 * @param {string} tags
 */
export async function randomE621Url(tags) {
  const j = await fetchJson(e621(tags), 0, {
    'user-agent': 'KirbyBot/1.0 (e621 API consumer; see https://e621.net/help/api)',
  });
  const p = pickE621(j?.posts ?? []);
  if (!p?.file?.url) throw new Error('Sin resultados en e621.');
  return String(p.file.url || p.file.sample?.url);
}
