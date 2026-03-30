import { Router } from 'express';
import { query } from '../../database/db.js';

const r = Router();

r.get('/', async (_req, res) => {
  try {
    const rows = await query(
      'SELECT instance_id, owner_jid, short_name, long_name, currency_name, updated_at FROM bot_instances ORDER BY updated_at DESC'
    );
    res.json({
      ok: true,
      data: rows.map((b) => ({
        phone: b.instance_id,
        name_short: b.short_name,
        name_long: b.long_name,
        currency: b.currency_name,
        active: true,
      })),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

r.get('/:phone', async (req, res) => {
  res.json({ ok: true, data: { phone: req.params.phone } });
});

r.patch('/:phone', async (_req, res) => {
  res.json({ ok: true, message: 'Pendiente de sincronizar con Baileys.' });
});

r.delete('/:phone', async (_req, res) => {
  res.json({ ok: true, message: 'Usa comandos del bot o gestión manual de sesión.' });
});

export default r;
