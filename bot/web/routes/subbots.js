import { Router } from 'express';

const r = Router();

r.post('/create', (_req, res) => {
  res.status(501).json({ ok: false, error: 'Ver documentación Tarea 18: SSE + Baileys compartido.' });
});

r.get('/list', (_req, res) => {
  res.json({ ok: true, data: [] });
});

export default r;
