import { Router } from 'express';
import { query } from '../../database/db.js';

const r = Router();

r.get('/characters', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await query(
      'SELECT id, name, series, rarity, base_value, preview_url FROM gacha_characters ORDER BY id DESC LIMIT ?',
      [limit]
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

r.post('/characters', async (_req, res) => {
  res.status(501).json({ ok: false, error: 'Crear personaje vía API pendiente.' });
});

r.patch('/characters/:id', async (_req, res) => {
  res.status(501).json({ ok: false });
});

r.delete('/characters/:id', async (_req, res) => {
  res.status(501).json({ ok: false });
});

r.post('/characters/:id/images', async (_req, res) => {
  res.status(501).json({ ok: false });
});

r.get('/series', async (_req, res) => {
  try {
    const rows = await query(
      'SELECT series, COUNT(*)::int AS c FROM gacha_characters GROUP BY series ORDER BY series'
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

export default r;
