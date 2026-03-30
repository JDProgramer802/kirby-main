import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

import { ensureTables, runSchemaMigrations } from '../database/db.js';
import { applyPanelConfigFromDb } from '../database/panelConfig.js';
import { loadCommands, getAllCommands } from '../core/loader.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { requireJwt } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import botsRoutes from './routes/bots.js';
import groupsRoutes from './routes/groups.js';
import usersRoutes from './routes/users.js';
import economyRoutes from './routes/economy.js';
import gachaRoutes from './routes/gacha.js';
import qrRoutes from './routes/qr.js';
import subbotsRoutes from './routes/subbots.js';
import configRoutes from './routes/config.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const panelDir = path.join(__dirname, 'panel');
const port = Number(process.env.WEB_PORT ?? 3000);

await runSchemaMigrations().catch((e) => console.error('[web migrations]', e));
await ensureTables();
await applyPanelConfigFromDb();
await loadCommands();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(apiLimiter);

app.use(express.static(panelDir));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

app.use('/api/dashboard', requireJwt, dashboardRoutes);
app.use('/api/bots', requireJwt, botsRoutes);
app.use('/api/groups', requireJwt, groupsRoutes);
app.use('/api/users', requireJwt, usersRoutes);
app.use('/api/economy', requireJwt, economyRoutes);
app.use('/api/gacha', requireJwt, gachaRoutes);
app.use('/api/qr', requireJwt, qrRoutes);
app.use('/api/subbots', requireJwt, subbotsRoutes);
app.use('/api/config', requireJwt, configRoutes);

app.post('/api/commands/reload', requireJwt, async (_req, res) => {
  try {
    await loadCommands();
    res.json({ ok: true, count: getAllCommands().length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Error' });
});

app.listen(port, () => {
  console.log(`Panel API en http://127.0.0.1:${port}`);
});
