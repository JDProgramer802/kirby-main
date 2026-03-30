import { query } from './db.js';

/** Claves que el panel puede persistir (whitelist). */
export const PANEL_CONFIG_KEYS = [
  'BOT_PREFIX',
  'BOT_NAME',
  'BOT_OWNER',
  'SESSION_DIR',
  'DATABASE_URL',
  'GITHUB_TOKEN',
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'SUBBOTS',
  'LOG_LEVEL',
  'JWT_SECRET',
  'WEB_PORT',
  'WA_SKIP_VERSION_FETCH',
];

/** No sobrescribir process.env: el pool de pg ya se creó con DATABASE_URL del .env. */
const NO_RUNTIME_OVERRIDE = new Set(['DATABASE_URL']);

/**
 * Aplica valores guardados en `panel_config` sobre `process.env` (excepto las excluidas).
 * Ejecutar después de `ensureTables()`.
 */
export async function applyPanelConfigFromDb() {
  try {
    const rows = await query('SELECT key, value FROM panel_config');
    for (const r of rows) {
      const k = String(r.key);
      if (!PANEL_CONFIG_KEYS.includes(k)) continue;
      if (NO_RUNTIME_OVERRIDE.has(k)) continue;
      const v = r.value != null ? String(r.value) : '';
      if (v !== '') process.env[k] = v;
    }
    if (rows.some((r) => NO_RUNTIME_OVERRIDE.has(String(r.key)) && r.value)) {
      console.log(
        '[panel] Hay DATABASE_URL en panel_config: el pool ya usa .env; actualiza Secret/.env y reinicia para cambiar de base.'
      );
    }
  } catch (e) {
    console.warn('[panelConfig]', e instanceof Error ? e.message : e);
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
export async function upsertPanelConfig(key, value) {
  await query(
    `INSERT INTO panel_config (key, value, updated_at) VALUES (?, ?, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}
