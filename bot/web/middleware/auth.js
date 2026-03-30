import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET ?? 'change-me-in-production';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireJwt(req, res, next) {
  const h = req.headers.authorization;
  const tok = h?.startsWith('Bearer ') ? h.slice(7) : null;
  if (!tok) {
    return res.status(401).json({ ok: false, error: 'Token requerido' });
  }
  try {
    req.user = jwt.verify(tok, secret());
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
}

export { secret as jwtSecret };
