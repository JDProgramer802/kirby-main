import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 300_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
