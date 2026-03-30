import { Router } from 'express';
import { query } from '../../database/db.js';
import {
  PANEL_CONFIG_KEYS,
  upsertPanelConfig,
} from '../../database/panelConfig.js';

const r = Router();

/**
 * @param {string} key
 * @param {string} value
 */
function maskIfSensitive(key, value) {
  const k = key.toUpperCase();
  if (k === 'BOT_OWNER') {
    return { display: value, masked: false };
  }
  if (/TOKEN|SECRET|PASSWORD|DATABASE_URL|KEY/i.test(k)) {
    if (!value || value.length < 6) return { display: value ? '********' : '', masked: true };
    return { display: `********…${value.slice(-4)}`, masked: true, hasValue: true };
  }
  return { display: value, masked: false };
}

r.get('/', async (_req, res) => {
  try {
    const rows = await query('SELECT key, value, updated_at FROM panel_config ORDER BY key');
    const fromDb = Object.fromEntries(rows.map((row) => [String(row.key), String(row.value ?? '')]));

    const merged = {};
    for (const key of PANEL_CONFIG_KEYS) {
      const fromEnv = process.env[key] ?? '';
      const fromStore = fromDb[key] ?? '';
      const raw = fromStore !== '' ? fromStore : fromEnv;
      const m = maskIfSensitive(key, raw);
      merged[key] = {
        value: m.display,
        source: fromStore !== '' ? 'database' : fromStore === '' && fromEnv ? 'env' : 'empty',
        masked: m.masked,
        updated_at: rows.find((x) => String(x.key) === key)?.updated_at ?? null,
      };
    }

    res.json({ ok: true, keys: PANEL_CONFIG_KEYS, config: merged });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

r.patch('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const updates = body.updates && typeof body.updates === 'object' ? body.updates : body;

    for (const [key, val] of Object.entries(updates)) {
      if (!PANEL_CONFIG_KEYS.includes(key)) continue;
      let value = val == null ? '' : String(val);
      if (value === '') continue;
      if (typeof value === 'string' && value.startsWith('********')) continue;
      await upsertPanelConfig(key, value);
    }

    res.json({ ok: true, message: 'Guardado. Reinicia el bot para aplicar cambios (excepto valores ya en caliente).' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

r.post('/test-database', async (req, res) => {
  const url = String(req.body?.databaseUrl ?? process.env.DATABASE_URL ?? '').trim();
  if (!url) {
    return res.status(400).json({ ok: false, error: 'Falta databaseUrl o DATABASE_URL' });
  }
  const { Pool } = await import('pg');
  const testPool = new Pool({
    connectionString: url,
    max: 1,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const r2 = await testPool.query('SELECT 1 AS ok');
    await testPool.end();
    res.json({ ok: true, connected: Boolean(r2.rows[0]) });
  } catch (e) {
    try {
      await testPool.end();
    } catch {
      /* ignore */
    }
    res.status(400).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

r.get('/export-env', async (_req, res) => {
  try {
    const rows = await query('SELECT key, value FROM panel_config');
    const lines = [];
    lines.push('# Generado desde el panel — copia a GitHub Secrets o .env');
    for (const row of rows) {
      const k = String(row.key);
      if (!PANEL_CONFIG_KEYS.includes(k)) continue;
      const v = String(row.value ?? '').replace(/\n/g, '\\n');
      lines.push(`${k}=${v}`);
    }
    res.type('text/plain').send(lines.join('\n'));
  } catch (e) {
    res.status(500).send(String(e instanceof Error ? e.message : e));
  }
});

export default r;
