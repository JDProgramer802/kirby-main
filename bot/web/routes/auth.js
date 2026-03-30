import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne } from '../../database/db.js';
import { jwtSecret, requireJwt } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const r = Router();

r.get('/me', requireJwt, (req, res) => {
  res.json({ ok: true, user: req.user });
});

r.post('/login', loginLimiter, async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
    }
    const row = await queryOne('SELECT id, username, password_hash, role FROM web_users WHERE username = ?', [
      username,
    ]);
    if (!row || !(await bcrypt.compare(password, String(row.password_hash)))) {
      return res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
      { id: row.id, username: row.username, role: row.role },
      jwtSecret(),
      { expiresIn: '24h' }
    );
    return res.json({ ok: true, token, user: { id: row.id, username: row.username, role: row.role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

r.post('/logout', (req, res) => {
  res.json({ ok: true, message: 'Cierra sesión en el cliente eliminando el JWT.' });
});

export default r;
