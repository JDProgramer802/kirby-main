import { Router } from 'express';
import { query } from '../../database/db.js';

const r = Router();

r.get('/stats', async (_req, res) => {
  try {
    const botRows = await query('SELECT COUNT(*)::int AS c FROM bot_instances');
    const grpRows = await query('SELECT COUNT(*)::int AS c FROM group_settings');
    const usrRows = await query('SELECT COUNT(*)::int AS c FROM group_profiles');
    res.json({
      ok: true,
      data: {
        bots: botRows[0]?.c ?? 0,
        groups: grpRows[0]?.c ?? 0,
        profiles: usrRows[0]?.c ?? 0,
        commandsToday: 0,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e instanceof Error ? e.message : e) });
  }
});

r.get('/activity', async (_req, res) => {
  res.json({
    ok: true,
    data: {
      days: ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'],
      messages: [0, 0, 0, 0, 0, 0, 0],
      commands: [0, 0, 0, 0, 0, 0, 0],
    },
  });
});

export default r;
