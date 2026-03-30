import { Router } from 'express';

const r = Router();

r.get('/:groupJid', async (_req, res) => {
  res.json({ ok: true, data: [] });
});

r.patch('/:phone/:groupJid', async (_req, res) => {
  res.json({ ok: true });
});

export default r;
