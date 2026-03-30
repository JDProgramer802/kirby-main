import { Router } from 'express';
import { query } from '../../database/db.js';

const r = Router();

r.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const rows = await query(
      'SELECT jid, bot_enabled, economy_enabled, gacha_enabled, nsfw_enabled, antilink_enabled FROM group_settings ORDER BY jid LIMIT ? OFFSET ?',
      [limit, offset]
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

r.get('/:jid', async (req, res) => {
  res.json({ ok: true, data: { jid: req.params.jid } });
});

r.patch('/:jid', async (_req, res) => {
  res.json({ ok: true, message: 'PATCH pendiente de mapear a group_settings.' });
});

r.get('/:jid/users', async (_req, res) => {
  res.json({ ok: true, data: [] });
});

export default r;
