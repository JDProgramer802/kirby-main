import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool, ensureTables, runSchemaMigrations, query, queryOne } from '../database/db.js';
import { loadCommands, getAllCommands } from '../core/loader.js';

dotenv.config();

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function checkNodeModules() {
  await fs.access(path.join(root, 'node_modules', 'pg'), fs.constants.R_OK);
}

async function checkDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) console.warn('[setup] DATABASE_URL no definida (modo local Laragon).');
  else {
    const r = await pool.query('SELECT 1 AS ok');
    if (!r.rows[0]) throw new Error('Ping DB falló');
    console.log('[setup] Conexión PostgreSQL OK.');
  }
}

async function checkGithubToken() {
  const t = process.env.GITHUB_TOKEN?.trim();
  if (!t) {
    console.warn('[setup] GITHUB_TOKEN ausente (opcional para banners).');
    return;
  }
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${t}`, 'user-agent': 'KirbyBot-setup' },
  });
  if (!res.ok) console.warn('[setup] GITHUB_TOKEN podría ser inválido:', res.status);
  else console.log('[setup] GitHub token parece válido.');
}

async function ensureSessionDir() {
  const dir = process.env.SESSION_DIR ?? path.join(root, 'sessions', 'main');
  await fs.mkdir(dir, { recursive: true });
  console.log('[setup] Carpeta sesión:', dir);
}

function summarizeCommands() {
  const by = new Map();
  for (const c of getAllCommands()) {
    const cat = c.category ?? 'Sin categoría';
    by.set(cat, (by.get(cat) ?? 0) + 1);
  }
  console.log('\n[setup] Comandos por categoría:');
  for (const [k, v] of [...by.entries()].sort()) console.log(`  ${k}: ${v}`);
  console.log('[setup] Total:', getAllCommands().length);
}

async function main() {
  console.log('[setup] Verificando dependencias...');
  await checkNodeModules();
  await checkDatabaseUrl();
  await runSchemaMigrations();
  await ensureTables();
  const wu = await queryOne('SELECT id FROM web_users LIMIT 1');
  if (!wu) {
    const hash = await bcrypt.hash('admin', 10);
    await query('INSERT INTO web_users (username, password_hash, role) VALUES (?, ?, ?::user_role)', [
      'admin',
      hash,
      'admin',
    ]);
    console.warn('[setup] Usuario panel creado: admin / admin — cámbialo en producción.');
  }
  await checkGithubToken();
  await ensureSessionDir();
  await loadCommands();
  summarizeCommands();
  console.log('\n[setup] Listo. Ejecuta npm start o npm run web.');
  await pool.end();
}

main().catch((e) => {
  console.error('[setup]', e);
  process.exit(1);
});
