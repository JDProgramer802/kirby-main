import { Router } from 'express';

const r = Router();

r.post('/generate', (_req, res) => {
  res.status(501).json({ ok: false, error: 'Generar QR en servidor requiere motor Baileys compartido (próximo paso).' });
});

r.get('/status/:phone', (req, res) => {
  res.json({ ok: true, data: { phone: req.params.phone, state: 'unknown' } });
});

r.post('/disconnect/:phone', (req, res) => {
  res.json({ ok: true, phone: req.params.phone });
});

export default r;
