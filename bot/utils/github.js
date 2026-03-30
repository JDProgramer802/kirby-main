/**
 * GitHub REST API (Contents) para multimedia stateless.
 * Requiere: GITHUB_TOKEN (repo scope), GITHUB_REPO (usuario/repo), GITHUB_BRANCH
 */

const api = 'https://api.github.com';

function authHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN no configurado.');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function parseRepo() {
  const raw = process.env.GITHUB_REPO ?? '';
  const [owner, repo] = String(raw).split('/').map((s) => s.trim());
  if (!owner || !repo) throw new Error('GITHUB_REPO debe ser usuario/repositorio.');
  return { owner, repo };
}

function branch() {
  return process.env.GITHUB_BRANCH ?? 'main';
}

function normalizePath(folder, filename) {
  const f = String(folder ?? '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\\/g, '/');
  const name = String(filename).replace(/^\/+/, '');
  return f ? `${f}/${name}` : name;
}

/**
 * @param {string} pathInRepo
 */
function encodePath(pathInRepo) {
  return pathInRepo.split('/').map(encodeURIComponent).join('/');
}

/**
 * @param {string} pathInRepo
 */
export function getRawFileUrl(pathInRepo) {
  const { owner, repo } = parseRepo();
  const b = branch();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(b)}/${encodePath(pathInRepo)}`;
}

/**
 * @param {string} pathInRepo
 */
async function getContentMeta(pathInRepo) {
  const { owner, repo } = parseRepo();
  const url = `${api}/repos/${owner}/${repo}/contents/${encodePath(pathInRepo)}?ref=${encodeURIComponent(branch())}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getContent: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {string} [folder]
 */
export async function uploadFile(buffer, filename, folder = '') {
  const pathInRepo = normalizePath(folder, filename);
  const content = Buffer.from(buffer).toString('base64');
  const existing = await getContentMeta(pathInRepo);
  const { owner, repo } = parseRepo();
  const putUrl = `${api}/repos/${owner}/${repo}/contents/${encodePath(pathInRepo)}`;

  const body = {
    message: `bot: upload ${pathInRepo}`,
    content,
    branch: branch(),
  };
  if (existing?.sha) body.sha = existing.sha;

  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub upload: ${res.status} ${await res.text()}`);
  return getRawFileUrl(pathInRepo);
}

/**
 * @param {string} filename
 * @param {string} [folder]
 */
export async function deleteFile(filename, folder = '') {
  const pathInRepo = normalizePath(folder, filename);
  const existing = await getContentMeta(pathInRepo);
  if (!existing?.sha) return false;
  const { owner, repo } = parseRepo();
  const url = `${api}/repos/${owner}/${repo}/contents/${encodePath(pathInRepo)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `bot: delete ${pathInRepo}`,
      sha: existing.sha,
      branch: branch(),
    }),
  });
  if (!res.ok) throw new Error(`GitHub delete: ${res.status} ${await res.text()}`);
  return true;
}

/**
 * URL raw de un archivo existente (sin comprobar existencia).
 * @param {string} filename
 * @param {string} [folder]
 */
export async function getFile(filename, folder = '') {
  const pathInRepo = normalizePath(folder, filename);
  const meta = await getContentMeta(pathInRepo);
  if (!meta || meta.type !== 'file') return null;
  return meta.download_url ?? getRawFileUrl(pathInRepo);
}

/**
 * Lista archivos en una carpeta del repo.
 * @param {string} [folder]
 * @returns {Promise<{ name: string, path: string, type: string, download_url: string | null }[]>}
 */
export async function listFiles(folder = '') {
  const pathInRepo = String(folder ?? '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\\/g, '/');
  const { owner, repo } = parseRepo();
  const pathSeg = pathInRepo ? `/${encodePath(pathInRepo)}` : '';
  const url = `${api}/repos/${owner}/${repo}/contents${pathSeg}?ref=${encodeURIComponent(branch())}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type,
    download_url: item.download_url ?? null,
  }));
}
