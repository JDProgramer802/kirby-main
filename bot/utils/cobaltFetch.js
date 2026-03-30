/**
 * Resolución de URL de medio vía API pública (puede cambiar o limitar).
 * No almacena archivos; solo devuelve URL directa para reenvío.
 */

/**
 * @param {string} pageUrl
 * @returns {Promise<{ url: string, isVideo?: boolean }>}
 */
export async function cobaltResolve(pageUrl) {
  const res = await fetch('https://api.cobalt.tools/api/json', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': 'KirbyBot/1.0',
    },
    body: JSON.stringify({ url: pageUrl, vCodec: 'h264', vQuality: '720' }),
  });
  if (!res.ok) throw new Error(`Cobalt HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === 'error') throw new Error(String(data.text ?? 'cobalt error'));
  const u = data.url;
  const url = Array.isArray(u) ? u[0] : u;
  if (!url || typeof url !== 'string') throw new Error('Sin URL de descarga');
  const lower = url.toLowerCase();
  const isVideo = lower.includes('.mp4') || lower.includes('video') || data.isAudio === false;
  return { url, isVideo: Boolean(isVideo && !lower.endsWith('.jpg')) };
}
