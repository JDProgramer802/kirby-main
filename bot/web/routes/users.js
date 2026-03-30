import { Router } from 'express';

const r = Router();

r.get('/', async (_req, res) => {
  res.json({ ok: true, data: [], message: 'Usa filtros por grupo cuando conectes el panel a group_profiles.' });
});

r.get('/:phone/:groupJid', async (req, res) => {
  res.json({ ok: true, data: { phone: req.params.phone, groupJid: req.params.groupJid } });
});

r.patch('/:phone/:groupJid', async (_req, res) => {
  res.json({ ok: true });
});

r.delete('/:phone/:groupJid', async (_req, res) => {
  res.json({ ok: true });
});

export default r;
